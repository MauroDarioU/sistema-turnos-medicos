// src/controllers/turnoController.js
//
// Controlador de Turnos: implementa el CRUD completo pedido por la
// consigna del proyecto, distinguiendo qué puede hacer cada rol:
//
//  - cliente (paciente): puede crear turnos para sí mismo, ver su propio
//    historial, y cancelar sus propios turnos.
//  - admin: puede ver TODOS los turnos (con filtros), y cambiar el estado
//    de cualquier turno (pendiente, confirmado, cancelado, completado).

const turnoService = require('../services/turnoService');

/**
 * POST /api/turnos
 * Crea un turno. El paciente SIEMPRE es el usuario autenticado (no se puede
 * crear un turno "para otra persona" pasando un id de paciente distinto):
 * esto es una regla de seguridad básica para que un cliente no pueda sacar
 * turnos en nombre de otros usuarios.
 */
async function crear(req, res, next) {
  try {
    const { profesional, especialidad, fecha, hora, motivoConsulta } = req.body;

    const turno = await turnoService.crearTurno({
      paciente: req.user.id, // Se toma del token, NUNCA del body.
      profesional,
      especialidad,
      fecha,
      hora,
      motivoConsulta,
    });

    return res.success(turno, 201);
  } catch (error) {
    // Errores de negocio esperados (ej: "el profesional ya tiene un turno
    // en ese horario") los devolvemos como 400, sin pasar por el
    // errorHandler genérico de 500.
    if (
      error.message.includes('no existe') ||
      error.message.includes('ya tiene un turno')
    ) {
      return res.error(error.message, 400);
    }
    return next(error);
  }
}

/**
 * GET /api/turnos/mis-turnos
 * Devuelve el historial de turnos del paciente autenticado.
 */
async function misTurnos(req, res, next) {
  try {
    const turnos = await turnoService.listarTurnosDePaciente(req.user.id);
    return res.success(turnos);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/turnos
 * Lista TODOS los turnos del sistema, con filtros opcionales por
 * especialidad, profesional y estado. Solo accesible por administradores.
 */
async function listarTodos(req, res, next) {
  try {
    const { especialidad, profesional, estado } = req.query;
    const turnos = await turnoService.listarTodosLosTurnos({
      especialidad,
      profesional,
      estado,
    });
    return res.success(turnos);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/turnos/:id
 * Obtiene el detalle de un turno puntual.
 * Regla de autorización: un admin puede ver cualquier turno; un cliente
 * solo puede ver SUS PROPIOS turnos.
 */
async function obtenerPorId(req, res, next) {
  try {
    const turno = await turnoService.obtenerTurnoPorId(req.params.id);

    if (!turno) {
      return res.error('Turno no encontrado', 404);
    }

    const esPropietario = turno.paciente._id.toString() === req.user.id;
    const esAdmin = req.user.rol === 'admin';

    if (!esPropietario && !esAdmin) {
      return res.error('No tenés permiso para ver este turno', 403);
    }

    return res.success(turno);
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/turnos/:id/estado
 * Cambia el estado de un turno (pendiente, confirmado, cancelado,
 * completado). Solo accesible por administradores.
 */
async function cambiarEstado(req, res, next) {
  try {
    const { estado } = req.body;
    const turno = await turnoService.cambiarEstadoTurno(req.params.id, estado);
    return res.success(turno);
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.error(error.message, 404);
    }
    return next(error);
  }
}

/**
 * DELETE /api/turnos/:id
 * Un paciente cancela su PROPIO turno. No es un borrado físico de la base
 * de datos (eso destruiría el historial): es un cambio de estado a
 * "cancelado", que es la práctica recomendada para mantener trazabilidad.
 */
async function cancelarPropio(req, res, next) {
  try {
    const turno = await turnoService.cancelarTurnoPropio(req.params.id, req.user.id);
    return res.success(turno);
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.error(error.message, 404);
    }
    if (error.message.includes('permiso')) {
      return res.error(error.message, 403);
    }
    return next(error);
  }
}

module.exports = {
  crear,
  misTurnos,
  listarTodos,
  obtenerPorId,
  cambiarEstado,
  cancelarPropio,
};
