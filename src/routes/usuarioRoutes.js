// src/routes/usuarioRoutes.js
//
// Rutas de gestión de usuarios. Todas requieren autenticación; algunas,
// además, requieren rol "admin" (control de acceso por rol, tal como pide
// la consigna del proyecto).

const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuarioController');
const authMiddleware = require('../middlewares/authMiddleware');
const soloRoles = require('../middlewares/roleMiddleware');
const manejarValidacion = require('../middlewares/validators/manejarValidacion');
const {
  validarCreacionConRol,
} = require('../middlewares/validators/usuarioValidator');

// Cualquier usuario autenticado puede ver la lista de profesionales
// disponibles (la necesita, por ejemplo, para elegir uno al sacar un turno).
router.get('/profesionales', authMiddleware, usuarioController.listarProfesionales);

// Las siguientes rutas son exclusivas de administradores:

// Crear un usuario con un rol específico (ej: dar de alta un profesional).
router.post(
  '/',
  authMiddleware,
  soloRoles('admin'),
  validarCreacionConRol,
  manejarValidacion,
  usuarioController.crear
);

// Listar todos los usuarios del sistema (con filtro opcional ?rol=).
router.get('/', authMiddleware, soloRoles('admin'), usuarioController.listar);

module.exports = router;
