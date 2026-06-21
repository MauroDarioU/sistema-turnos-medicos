// src/services/usuarioService.js
//
// Capa de SERVICIOS (en términos de Clean Architecture, esto sería nuestra
// "capa de Casos de Uso"): contiene la lógica de negocio de Usuario,
// separada de los controladores (que solo se ocupan de traducir HTTP <->
// lógica de negocio) y de los modelos (que solo describen la forma de los
// datos).
//
// Funciones que implementa:
//  - registrarUsuario: crea un nuevo usuario, hasheando su contraseña.
//  - loginUsuario: verifica credenciales y genera un JWT si son correctas.
//  - obtenerUsuarioPorId: utilidad para los controladores.

const Usuario = require('../models/Usuario');
const jwtService = require('./jwtService');
const { crearCredenciales, verificarPassword } = require('../utils/passwordUtils');

/**
 * Registra un nuevo usuario en el sistema.
 *
 * Regla de negocio importante (pedida en la consigna del proyecto): por este
 * endpoint público SOLO se pueden registrar usuarios con rol "cliente".
 * Si alguien intenta registrarse como "admin" desde afuera, lo ignoramos y
 * forzamos el rol "cliente". Los administradores deben crearse por otro
 * medio (semilla de datos / un admin existente), nunca auto-asignándose el
 * rol desde un formulario público.
 *
 * @param {object} datos - { nombre, email, password, especialidad? }
 * @returns {Promise<object>} El usuario creado (sin password).
 */
async function registrarUsuario(datos) {
  const { nombre, email, password, especialidad } = datos;

  const { salt, hash } = crearCredenciales(password);

  const nuevoUsuario = new Usuario({
    nombre,
    email,
    salt,
    hash,
    rol: 'cliente', // Forzado: ver explicación arriba.
    especialidad: especialidad || null,
  });

  return await nuevoUsuario.save();
}

/**
 * Crea un usuario administrador o profesional. A diferencia del registro
 * público, esta función SÍ permite especificar el rol, pero solo está
 * expuesta a través de un endpoint protegido (solo accesible por un admin
 * ya autenticado). Ver usuarioController.js / usuarioRoutes.js.
 */
async function crearUsuarioConRol(datos) {
  const { nombre, email, password, rol, especialidad } = datos;

  const { salt, hash } = crearCredenciales(password);

  const nuevoUsuario = new Usuario({
    nombre,
    email,
    salt,
    hash,
    rol,
    especialidad: especialidad || null,
  });

  return await nuevoUsuario.save();
}

/**
 * Intenta autenticar a un usuario con email + password.
 * Si las credenciales son correctas, devuelve un token JWT junto con los
 * datos públicos del usuario. Si son incorrectas, lanza un Error genérico
 * (nunca decimos "el email no existe" vs "la contraseña es incorrecta" por
 * separado: eso le daría pistas a un atacante sobre qué emails están
 * registrados en el sistema).
 *
 * @param {string} email
 * @param {string} password
 */
async function loginUsuario(email, password) {
  const usuario = await Usuario.findOne({ email: email.toLowerCase() });

  if (!usuario) {
    throw new Error('Credenciales inválidas');
  }

  const passwordValida = verificarPassword(password, usuario.salt, usuario.hash);

  if (!passwordValida) {
    throw new Error('Credenciales inválidas');
  }

  // El payload del JWT incluye lo mínimo necesario para el resto del
  // sistema: id (para buscar al usuario) y rol (para autorización), tal
  // como recomienda la clase 8.
  const payload = {
    id: usuario._id.toString(),
    email: usuario.email,
    rol: usuario.rol,
    nombre: usuario.nombre,
  };

  const token = jwtService.generateToken(payload);

  return { token, usuario };
}

/**
 * Busca un usuario por su ID. Lo usamos, por ejemplo, para mostrar el
 * perfil del usuario autenticado.
 */
async function obtenerUsuarioPorId(id) {
  return await Usuario.findById(id);
}

module.exports = {
  registrarUsuario,
  crearUsuarioConRol,
  loginUsuario,
  obtenerUsuarioPorId,
};
