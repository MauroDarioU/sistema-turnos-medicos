// src/middlewares/validators/turnoValidator.js
//
// Validaciones para la entidad Turno, mismo patrón que usuarioValidator.js.

const { body, param, query } = require('express-validator');
const { ESTADOS_VALIDOS } = require('../../models/Turno');

const validarCreacionTurno = [
  body('profesional')
    .notEmpty()
    .withMessage('El profesional es requerido')
    .isMongoId()
    .withMessage('El id del profesional no es válido'),

  body('especialidad')
    .trim()
    .notEmpty()
    .withMessage('La especialidad es requerida'),

  body('fecha')
    .notEmpty()
    .withMessage('La fecha es requerida')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('La fecha debe tener formato YYYY-MM-DD'),

  body('hora')
    .notEmpty()
    .withMessage('La hora es requerida')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('La hora debe tener formato HH:MM (24hs)'),

  body('motivoConsulta')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('El motivo de consulta no puede superar los 500 caracteres'),
];

const validarCambioEstado = [
  param('id').isMongoId().withMessage('El id del turno no es válido'),
  body('estado')
    .notEmpty()
    .withMessage('El estado es requerido')
    .isIn(ESTADOS_VALIDOS)
    .withMessage(`El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`),
];

const validarIdParam = [param('id').isMongoId().withMessage('El id no es válido')];

const validarFiltrosListado = [
  query('especialidad').optional().isString(),
  query('profesional').optional().isMongoId().withMessage('El id del profesional no es válido'),
  query('estado').optional().isIn(ESTADOS_VALIDOS),
];

module.exports = {
  validarCreacionTurno,
  validarCambioEstado,
  validarIdParam,
  validarFiltrosListado,
};
