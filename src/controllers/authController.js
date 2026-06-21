// src/controllers/authController.js
//
// Controlador de autenticación. Recordemos el rol de un controlador en
// Clean Architecture: es la "Capa de Interfaces" que conecta el mundo HTTP
// (req, res) con la lógica de negocio (los servicios). El controlador NO
// debería tener lógica de negocio compleja: solo toma datos de la request,
// le pide al servicio que haga el trabajo, y traduce el resultado a una
// respuesta HTTP.

const usuarioService = require('../services/usuarioService');

/**
 * POST /api/auth/register
 * Registro público de usuarios. Siempre crea usuarios con rol "cliente"
 * (ver usuarioService.registrarUsuario para el detalle de esa regla).
 */
async function register(req, res, next) {
  try {
    const { nombre, email, password, especialidad } = req.body;
    const usuario = await usuarioService.registrarUsuario({
      nombre,
      email,
      password,
      especialidad,
    });

    return res.success(usuario, 201);
  } catch (error) {
    // Si el error es de Mongoose/Mongo (validación, email duplicado, etc.)
    // lo delegamos al errorHandler central con next(error).
    return next(error);
  }
}

/**
 * POST /api/auth/login
 * Verifica credenciales y devuelve un JWT junto con los datos del usuario.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const { token, usuario } = await usuarioService.loginUsuario(email, password);

    return res.success({ token, usuario });
  } catch (error) {
    // Las credenciales inválidas NO son un error interno del servidor, son
    // un error esperado del cliente: respondemos 401 directamente, sin
    // pasar por el errorHandler genérico.
    return res.error(error.message, 401);
  }
}

/**
 * GET /api/auth/perfil
 * Devuelve los datos del usuario autenticado (requiere authMiddleware).
 * Es un ejemplo de "ruta privada" como las que vimos en la clase 8.
 */
async function perfil(req, res, next) {
  try {
    const usuario = await usuarioService.obtenerUsuarioPorId(req.user.id);

    if (!usuario) {
      return res.error('Usuario no encontrado', 404);
    }

    return res.success(usuario);
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login, perfil };
