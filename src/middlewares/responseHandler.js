// src/middlewares/responseHandler.js
//
// Middleware de respuestas estandarizadas, tal como se vio en la clase 6
// (Implementación de operaciones CRUD en la API). En lugar de escribir
// res.status(...).json(...) con una forma distinta en cada controlador,
// definimos dos métodos auxiliares sobre "res": res.success() y res.error().
//
// Esto cumple con la consigna de "respuestas estandarizadas" y hace que
// todos los controladores devuelvan respuestas con la MISMA forma:
//   Éxito:  { success: true,  data: ... }
//   Error:  { success: false, error: "mensaje", details: ... }

const responseHandler = (req, res, next) => {
  /**
   * Responde con éxito.
   * @param {*} data - Datos a devolver al cliente.
   * @param {number} statusCode - Código de estado HTTP (200 por defecto).
   */
  res.success = (data, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  };

  /**
   * Responde con un error.
   * @param {string} message - Mensaje de error legible para el cliente.
   * @param {number} statusCode - Código de estado HTTP (400 por defecto).
   * @param {*} details - Información adicional del error (opcional).
   */
  res.error = (message, statusCode = 400, details = null) => {
    return res.status(statusCode).json({
      success: false,
      error: message,
      details,
    });
  };

  next();
};

module.exports = responseHandler;
