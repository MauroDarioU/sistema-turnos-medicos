// src/middlewares/validators/usuarioValidator.js
//
// Validaciones con express-validator, siguiendo EXACTAMENTE el patrón de la
// clase 6 ("Implementación de operaciones CRUD en la API"): un array de
// reglas de validación que se usa como middleware intermedio en la ruta,
// antes de llegar al controlador.

const { body } = require('express-validator');

const validarRegistro = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede superar los 100 caracteres'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('El email debe tener un formato válido')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/\d/)
    .withMessage('La contraseña debe contener al menos un número')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe contener al menos una letra mayúscula'),

  // Si el cliente intenta enviar "rol" en el registro público, lo rechazamos
  // explícitamente con un mensaje claro (en vez de ignorarlo en silencio),
  // para que sea evidente en la documentación de la API que ese campo no se
  // controla desde este endpoint.
  body('rol')
    .not()
    .exists()
    .withMessage('No se puede especificar el rol en el registro público'),
];

const validarCreacionConRol = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').trim().isEmail().withMessage('El email debe tener un formato válido'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('rol')
    .notEmpty()
    .withMessage('El rol es requerido')
    .isIn(['admin', 'cliente'])
    .withMessage('El rol debe ser "admin" o "cliente"'),
  body('especialidad')
    .optional()
    .isString()
    .withMessage('La especialidad debe ser un texto'),
];

const validarLogin = [
  body('email').trim().notEmpty().withMessage('El email es requerido').isEmail(),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
];

module.exports = {
  validarRegistro,
  validarCreacionConRol,
  validarLogin,
};
