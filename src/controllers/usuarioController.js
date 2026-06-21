// src/controllers/usuarioController.js
//
// Controlador para la gestión de usuarios desde el panel de administración:
// permite a un admin crear otros usuarios especificando su rol (por ejemplo,
// para dar de alta profesionales de la salud con rol "admin" y una
// especialidad asignada) y listar todos los usuarios del sistema.
//
// Estas rutas están protegidas con authMiddleware + roleMiddleware('admin')
// (ver usuarioRoutes.js), por lo que dentro del controlador ya podemos
// asumir que req.user existe y es un administrador.

const usuarioService = require('../services/usuarioService');
const Usuario = require('../models/Usuario');

/**
 * POST /api/usuarios
 * Crea un usuario con un rol específico. Solo accesible por administradores.
 * A diferencia de /api/auth/register, este endpoint SÍ permite asignar rol.
 */
async function crear(req, res, next) {
  try {
    const { nombre, email, password, rol, especialidad } = req.body;

    const usuario = await usuarioService.crearUsuarioConRol({
      nombre,
      email,
      password,
      rol,
      especialidad,
    });

    return res.success(usuario, 201);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/usuarios
 * Lista todos los usuarios del sistema. Solo accesible por administradores.
 * Permite un filtro opcional por rol (?rol=admin) para, por ejemplo, listar
 * solo los profesionales disponibles.
 */
async function listar(req, res, next) {
  try {
    const filtro = {};
    if (req.query.rol) filtro.rol = req.query.rol;

    const usuarios = await Usuario.find(filtro).sort({ nombre: 1 });
    return res.success(usuarios);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/usuarios/profesionales
 * Endpoint de conveniencia, accesible para cualquier usuario autenticado
 * (no solo admins): lista los profesionales disponibles para poder elegir
 * uno a la hora de sacar un turno. No expone información sensible.
 */
async function listarProfesionales(req, res, next) {
  try {
    const filtro = { rol: 'admin' };
    if (req.query.especialidad) filtro.especialidad = req.query.especialidad;

    const profesionales = await Usuario.find(filtro).select(
      'nombre especialidad email'
    );

    return res.success(profesionales);
  } catch (error) {
    return next(error);
  }
}

module.exports = { crear, listar, listarProfesionales };
