// src/utils/passwordUtils.js
//
// Esta utilidad implementa el hashing de contraseñas EXACTAMENTE como se vio
// en la clase de "Seguridad en Aplicaciones Web": usamos el módulo nativo
// "crypto" de Node.js (no necesitamos instalar nada) con la técnica de
// HMAC-SHA256 + salt.
//
// Recordatorio teórico (de la clase):
//  - Hashing es IRREVERSIBLE: a partir del hash no se puede reconstruir la
//    contraseña original.
//  - El "salt" es un valor aleatorio único por usuario que se concatena/mezcla
//    con la contraseña antes de hashear. Esto evita que dos usuarios con la
//    misma contraseña tengan el mismo hash, y dificulta ataques de
//    "rainbow tables".
//  - Por eso en la base de datos NUNCA guardamos la contraseña en texto
//    plano: guardamos el salt y el hash resultante.

const crypto = require('crypto');
const config = require('../config/config');

/**
 * Genera un salt aleatorio en formato hexadecimal.
 * Se genera uno nuevo y distinto para cada usuario que se registra.
 */
function generarSalt() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Genera el hash de una contraseña a partir de:
 *  - La contraseña en texto plano.
 *  - El salt individual del usuario.
 *  - Un "secreto de aplicación" (config.appHashSecret) que actúa como una
 *    capa extra de seguridad (similar a un segundo factor / key stretching
 *    simplificado): aunque alguien filtre la base de datos completa (con
 *    salts y hashes), sin este secreto -que vive solo en el servidor, en el
 *    .env- no puede recalcular los hashes para probar contraseñas conocidas.
 *
 * @param {string} password - Contraseña en texto plano.
 * @param {string} salt - Salt individual del usuario.
 * @returns {string} Hash resultante en formato hexadecimal.
 */
function hashPassword(password, salt) {
  // HMAC con SHA-256. La "clave" del HMAC combina el salt del usuario con el
  // secreto de la aplicación, y el "mensaje" es la contraseña.
  const claveHmac = `${salt}:${config.appHashSecret}`;

  return crypto
    .createHmac('sha256', claveHmac)
    .update(password)
    .digest('hex');
}

/**
 * Genera un objeto { salt, hash } listo para guardar en la base de datos
 * cuando un usuario se registra o cambia su contraseña.
 */
function crearCredenciales(password) {
  const salt = generarSalt();
  const hash = hashPassword(password, salt);
  return { salt, hash };
}

/**
 * Verifica si una contraseña en texto plano corresponde al hash almacenado,
 * recalculando el hash con el mismo salt y comparando el resultado.
 *
 * @param {string} password - Contraseña ingresada por el usuario al loguearse.
 * @param {string} salt - Salt almacenado en la base de datos para ese usuario.
 * @param {string} hashAlmacenado - Hash almacenado en la base de datos.
 * @returns {boolean} true si la contraseña es correcta.
 */
function verificarPassword(password, salt, hashAlmacenado) {
  const hashCalculado = hashPassword(password, salt);

  // Usamos timingSafeEqual en lugar de "===" para comparar los hashes.
  // Esto evita "timing attacks": comparar strings con === puede tardar un
  // poco más o menos según cuántos caracteres coincidan al principio, y un
  // atacante muy paciente podría usar esa diferencia de tiempo para ir
  // adivinando el hash caracter por caracter. timingSafeEqual compara
  // siempre en tiempo constante.
  const bufferCalculado = Buffer.from(hashCalculado, 'hex');
  const bufferAlmacenado = Buffer.from(hashAlmacenado, 'hex');

  if (bufferCalculado.length !== bufferAlmacenado.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferCalculado, bufferAlmacenado);
}

module.exports = {
  generarSalt,
  hashPassword,
  crearCredenciales,
  verificarPassword,
};
