// src/middlewares/validators/manejarValidacion.js
//
// Pequeño middleware reutilizable que revisa si express-validator encontró
// errores (acumulados por las reglas definidas en usuarioValidator.js /
// turnoValidator.js) y, si los hay, responde inmediatamente con un 400 y el
// detalle de cada error. Si no hay errores, deja pasar la solicitud con
// next() para que llegue al controlador.
//
// Esto evita repetir el bloque "const errors = validationResult(req); ..."
// en cada una de las funciones de los controladores (principio DRY: Don't
// Repeat Yourself).

const { validationResult } = require('express-validator');

function manejarValidacion(req, res, next) {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    // Transformamos los errores de express-validator en un array simple de
    // mensajes, más fácil de leer para quien consuma la API.
    const mensajes = errores.array().map((error) => error.msg);
    return res.error('Errores de validación', 400, mensajes);
  }

  next();
}

module.exports = manejarValidacion;
