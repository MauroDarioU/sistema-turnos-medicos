// src/models/Turno.js
//
// Modelo de Turno médico. Representa la entidad central del sistema: un
// turno vincula a un paciente con un profesional, en una fecha/hora y
// especialidad determinada, y tiene un estado que cambia a lo largo del
// tiempo (pendiente -> confirmado -> cancelado, etc).
//
// Usamos referencias (ref) a la colección "usuarios" para "paciente" y
// "profesional", en lugar de duplicar sus datos. Esto es lo que se llama
// "populate" en Mongoose: más adelante, al consultar turnos, podemos pedirle
// a Mongoose que automáticamente traiga los datos del usuario relacionado.

const mongoose = require('mongoose');

const ESTADOS_VALIDOS = ['pendiente', 'confirmado', 'cancelado', 'completado'];

const turnoSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El turno debe estar asociado a un paciente'],
    },
    profesional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El turno debe estar asociado a un profesional'],
    },
    especialidad: {
      type: String,
      required: [true, 'La especialidad es obligatoria'],
      trim: true,
    },
    fecha: {
      // Guardamos la fecha como String en formato "YYYY-MM-DD" para que sea
      // muy fácil de validar, comparar y mostrar sin lidiar con zonas
      // horarias (un tema que excede el alcance de esta materia).
      type: String,
      required: [true, 'La fecha es obligatoria'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'],
    },
    hora: {
      // Mismo criterio que la fecha: guardamos la hora como String
      // "HH:MM" en formato 24 horas.
      type: String,
      required: [true, 'La hora es obligatoria'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'La hora debe tener formato HH:MM (24hs)'],
    },
    estado: {
      type: String,
      enum: {
        values: ESTADOS_VALIDOS,
        message: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`,
      },
      default: 'pendiente',
    },
    motivoConsulta: {
      type: String,
      trim: true,
      maxlength: [500, 'El motivo de consulta no puede superar los 500 caracteres'],
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'turnos',
  }
);

// Índice compuesto: evita que el mismo profesional tenga dos turnos
// (no cancelados) exactamente a la misma fecha y hora. Esto es parte de la
// "lógica de control de agenda" que pide la consigna del proyecto.
// No lo hacemos "unique" estricto a nivel de Mongo porque el estado puede
// ser "cancelado" y en ese caso sí debería poder reutilizarse el horario;
// ese control más fino lo hacemos en la capa de servicio (turnoService.js).
turnoSchema.index({ profesional: 1, fecha: 1, hora: 1 });

module.exports = mongoose.model('Turno', turnoSchema);
module.exports.ESTADOS_VALIDOS = ESTADOS_VALIDOS;
