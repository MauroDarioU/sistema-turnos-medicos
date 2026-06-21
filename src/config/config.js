// src/config/config.js
//
// Centralizamos aquí TODAS las variables de configuración de la app.
// Esto sigue exactamente el patrón que vimos en la clase 8 (Autenticación y
// autorización): en vez de leer process.env.LO_QUE_SEA en cualquier parte del
// código, lo leemos una sola vez aquí y el resto de la app importa este objeto.
//
// Ventajas:
//  - Si cambia el nombre de una variable de entorno, solo se modifica un lugar.
//  - Permite definir valores por defecto (ej: si no hay PORT, usamos 3000).
//  - Hace explícito, leyendo un solo archivo, qué configuración necesita la app.

require('dotenv').config(); // Carga las variables definidas en el archivo .env

module.exports = {
  port: process.env.PORT || 3000,

  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/turnos_medicos',

  jwtSecret: process.env.JWT_SECRET || 'clave-secreta-de-desarrollo',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',

  // Salt "de aplicación" que se suma al salt individual de cada usuario
  // a la hora de hashear contraseñas (ver utils/passwordUtils.js).
  appHashSecret: process.env.APP_HASH_SECRET || 'otra-clave-de-desarrollo',
};
