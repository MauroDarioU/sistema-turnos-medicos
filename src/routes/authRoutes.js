// src/routes/authRoutes.js
//
// Rutas de autenticación: registro, login y perfil del usuario autenticado.
// Seguimos el patrón de la clase 6/8: el archivo de rutas solo DEFINE los
// caminos y qué middlewares/controlador se ejecutan; toda la lógica vive en
// otro lado (validators, controllers, services).

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const manejarValidacion = require('../middlewares/validators/manejarValidacion');
const {
  validarRegistro,
  validarLogin,
} = require('../middlewares/validators/usuarioValidator');

// Ruta pública: cualquiera puede registrarse como "cliente".
router.post('/register', validarRegistro, manejarValidacion, authController.register);

// Ruta pública: login. Devuelve un JWT si las credenciales son correctas.
router.post('/login', validarLogin, manejarValidacion, authController.login);

// Ruta privada: requiere un token válido. Devuelve los datos del usuario
// autenticado (útil para que el front-end sepa quién está logueado).
router.get('/perfil', authMiddleware, authController.perfil);

module.exports = router;
