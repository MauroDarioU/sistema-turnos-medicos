// src/middlewares/authMiddleware.js
//
// Middleware de autenticación con JWT, siguiendo el patrón EXACTO de la
// clase 8 (Autenticación y autorización): extraemos el token del header
// "Authorization: Bearer <token>", lo verificamos con jwtService, y si es
// válido, adjuntamos los datos del usuario a req.user para que los
// controladores siguientes puedan usarlos.
//
// Si el token falta o es inválido/expiró, respondemos con 401 Unauthorized
// y la solicitud NUNCA llega al controlador protegido.

const jwtService = require('../services/jwtService');

function authMiddleware(req, res, next) {
  // El header tiene la forma: "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.error('Token no encontrado. Acceso denegado.', 401);
  }

  // Separamos "Bearer" del token en sí mismo.
  const partes = authHeader.split(' ');
  const token = partes[1];

  if (partes[0] !== 'Bearer' || !token) {
    return res.error('Formato de token inválido. Use: Bearer <token>', 401);
  }

  try {
    const payload = jwtService.verifyToken(token);
    // Adjuntamos el payload decodificado (id, email, rol, etc.) a req.user
    // para que los siguientes middlewares/controladores sepan quién hizo
    // la solicitud, sin tener que volver a consultar la base de datos.
    req.user = payload;
    next();
  } catch (error) {
    return res.error('Token inválido o expirado.', 401);
  }
}

module.exports = authMiddleware;
