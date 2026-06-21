// src/services/turnoService.js
//
// Capa de servicios para la entidad Turno. Acá vive la lógica de negocio
// más importante del proyecto: crear turnos validando que el profesional
// esté disponible, listar turnos con filtros, y cambiar su estado.

const Turno = require('../models/Turno');
const Usuario = require('../models/Usuario');

/**
 * Crea un nuevo turno, validado por reglas de negocio (no solo por el
 * schema de Mongoose). Esta es la "lógica de control de agenda" que pide
 * la consigna del proyecto.
 *
 * Reglas que verificamos:
 *  1. El profesional debe existir y tener rol "admin" en este sistema
 *     simplificado consideramos que los profesionales de salud son
 *     usuarios con rol "admin" que además tienen una "especialidad"
 *     asignada (ver Usuario.js). Esta decisión de diseño se explica con
 *     más detalle en el README.
 *  2. El profesional no puede tener ya un turno (no cancelado) en la
 *     misma fecha y hora: esto evita el "doble booking".
 *
 * @param {object} datosTurno - { paciente, profesional, especialidad, fecha, hora, motivoConsulta }
 */
async function crearTurno(datosTurno) {
  const { profesional, fecha, hora } = datosTurno;

  // 1. Verificamos que el profesional exista y sea efectivamente un
  // profesional de salud registrado en el sistema (rol "admin" en este
  // modelo simplificado, ver explicación en el comentario de la función).
  const profesionalExiste = await Usuario.findOne({ _id: profesional, rol: 'admin' });
  if (!profesionalExiste) {
    throw new Error('El profesional indicado no existe');
  }

  // 2. Verificamos disponibilidad de agenda: buscamos si ya existe un
  // turno NO cancelado para ese profesional, en esa fecha y hora exactas.
  const turnoExistente = await Turno.findOne({
    profesional,
    fecha,
    hora,
    estado: { $ne: 'cancelado' },
  });

  if (turnoExistente) {
    throw new Error('El profesional ya tiene un turno asignado en ese horario');
  }

  const nuevoTurno = new Turno(datosTurno);
  return await nuevoTurno.save();
}

/**
 * Lista los turnos de un paciente específico (su propio "historial de
 * turnos", como pide la consigna).
 */
async function listarTurnosDePaciente(pacienteId) {
  return await Turno.find({ paciente: pacienteId })
    .populate('profesional', 'nombre email especialidad')
    .sort({ fecha: 1, hora: 1 });
}

/**
 * Lista TODOS los turnos del sistema (solo para administradores), con
 * filtros opcionales por especialidad, profesional y estado, tal como pide
 * la consigna ("consulta filtrando por especialidad, profesional, etc.").
 *
 * @param {object} filtros - { especialidad?, profesional?, estado?, paciente? }
 */
async function listarTodosLosTurnos(filtros = {}) {
  const query = {};

  if (filtros.especialidad) query.especialidad = filtros.especialidad;
  if (filtros.profesional) query.profesional = filtros.profesional;
  if (filtros.estado) query.estado = filtros.estado;
  if (filtros.paciente) query.paciente = filtros.paciente;

  return await Turno.find(query)
    .populate('paciente', 'nombre email')
    .populate('profesional', 'nombre email especialidad')
    .sort({ fecha: 1, hora: 1 });
}

/**
 * Busca un único turno por su ID.
 */
async function obtenerTurnoPorId(id) {
  return await Turno.findById(id)
    .populate('paciente', 'nombre email')
    .populate('profesional', 'nombre email especialidad');
}

/**
 * Actualiza el estado de un turno (pendiente, confirmado, cancelado,
 * completado), operación reservada a administradores según la consigna.
 */
async function cambiarEstadoTurno(id, nuevoEstado) {
  const turno = await Turno.findById(id);

  if (!turno) {
    throw new Error('Turno no encontrado');
  }

  turno.estado = nuevoEstado;
  return await turno.save();
}

/**
 * Permite que un paciente cancele su PROPIO turno (regla de autorización a
 * nivel de negocio: un paciente nunca debería poder cancelar el turno de
 * otra persona, aunque conozca su ID).
 */
async function cancelarTurnoPropio(turnoId, pacienteId) {
  const turno = await Turno.findById(turnoId);

  if (!turno) {
    throw new Error('Turno no encontrado');
  }

  if (turno.paciente.toString() !== pacienteId) {
    throw new Error('No tenés permiso para cancelar este turno');
  }

  turno.estado = 'cancelado';
  return await turno.save();
}

module.exports = {
  crearTurno,
  listarTurnosDePaciente,
  listarTodosLosTurnos,
  obtenerTurnoPorId,
  cambiarEstadoTurno,
  cancelarTurnoPropio,
};
