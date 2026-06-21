// src/services/jwtService.js
//
// Servicio que modulariza TODA la lógica relacionada a JWT, exactamente
// como se propone en la clase 8. Centralizar esto en un servicio (en lugar
// de llamar a jwt.sign/jwt.verify directamente desde los controladores)
// nos permite:
//  - Reusar la misma configuración (secret, expiresIn) en todos lados.
//  - Cambiar de librería de JWT en el futuro tocando un solo archivo.
//  - Testear la generación/verificación de tokens de forma aislada.

const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Genera un JWT firmado a partir de un payload.
 * @param {object} payload - Datos a incluir en el token (id, email, rol...).
 * @returns {string} Token JWT firmado.
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Verifica un JWT y devuelve su payload decodificado.
 * Lanza un error (capturado por quien llame a esta función) si el token
 * es inválido o expiró.
 * @param {string} token
 * @returns {object} Payload decodificado.
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = {
  generateToken,
  verifyToken,
};
