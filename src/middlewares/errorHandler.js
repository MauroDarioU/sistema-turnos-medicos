// src/middlewares/errorHandler.js
//
// Middleware de manejo de errores centralizado, igual al patrón visto en la
// clase 6. Un middleware de error en Express se reconoce porque recibe
// CUATRO parámetros: (err, req, res, next). Express lo detecta
// automáticamente por esa firma y lo ejecuta cuando algún código anterior
// llama a next(error), o cuando una promesa rechazada no fue atrapada.
//
// IMPORTANTE: este middleware se registra siempre AL FINAL de todos los
// demás middlewares y rutas en app.js, porque Express ejecuta los
// middlewares de error solo cuando ya pasamos por el resto de la cadena (o
// cuando se invoca next(error) explícitamente).

const errorHandler = (err, req, res, next) => {
  console.error('🔥 Error capturado por errorHandler:', err);

  // Error de validación de Mongoose (ej: falta un campo "required",
  // un enum no válido, etc.)
  if (err.name === 'ValidationError') {
    const detalles = Object.values(err.errors).map((e) => e.message);
    return res.error('Datos inválidos', 400, detalles);
  }

  // Error de "duplicate key" de MongoDB (ej: email que ya existe, porque
  // el campo está marcado como "unique" en el schema).
  if (err.code === 11000) {
    const campo = Object.keys(err.keyPattern || {})[0] || 'campo';
    return res.error(`Ya existe un registro con ese ${campo}`, 409);
  }

  // Error de "CastError" de Mongoose (ej: se pasó un ID con formato
  // inválido a Mongo, como "123" en lugar de un ObjectId válido).
  if (err.name === 'CastError') {
    return res.error('El identificador proporcionado no es válido', 400);
  }

  // Cualquier otro error no controlado: respondemos genérico (sin exponer
  // detalles internos del sistema, como recomienda la clase de buenas
  // prácticas) pero lo dejamos completo en el log del servidor para debug.
  return res.error('Error interno del servidor', 500);
};

module.exports = errorHandler;
