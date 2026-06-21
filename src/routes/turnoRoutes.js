// src/routes/turnoRoutes.js
//
// Rutas de turnos: el corazón funcional del sistema. Notar el orden de los
// middlewares en cada ruta: primero autenticamos (authMiddleware), luego
// autorizamos por rol si corresponde (soloRoles), luego validamos el body
// (validarX), luego procesamos esa validación (manejarValidacion), y
// finalmente llega al controlador. Este orden es importante: no tiene
// sentido validar el body de alguien que ni siquiera está autenticado.

const express = require('express');
const router = express.Router();

const turnoController = require('../controllers/turnoController');
const authMiddleware = require('../middlewares/authMiddleware');
const soloRoles = require('../middlewares/roleMiddleware');
const manejarValidacion = require('../middlewares/validators/manejarValidacion');
const {
  validarCreacionTurno,
  validarCambioEstado,
  validarIdParam,
  validarFiltrosListado,
} = require('../middlewares/validators/turnoValidator');

// Todas las rutas de turnos requieren estar autenticado.
router.use(authMiddleware);

// POST /api/turnos -> Un paciente crea un turno para sí mismo.
router.post('/', validarCreacionTurno, manejarValidacion, turnoController.crear);

// GET /api/turnos/mis-turnos -> Historial de turnos del paciente autenticado.
router.get('/mis-turnos', turnoController.misTurnos);

// GET /api/turnos -> Listado completo (solo admin), con filtros por query string.
router.get(
  '/',
  soloRoles('admin'),
  validarFiltrosListado,
  manejarValidacion,
  turnoController.listarTodos
);

// GET /api/turnos/:id -> Detalle de un turno (admin, o el propio paciente).
router.get('/:id', validarIdParam, manejarValidacion, turnoController.obtenerPorId);

// PUT /api/turnos/:id/estado -> Cambiar estado de un turno (solo admin).
router.put(
  '/:id/estado',
  soloRoles('admin'),
  validarCambioEstado,
  manejarValidacion,
  turnoController.cambiarEstado
);

// DELETE /api/turnos/:id -> El paciente cancela su propio turno.
router.delete('/:id', validarIdParam, manejarValidacion, turnoController.cancelarPropio);

module.exports = router;
