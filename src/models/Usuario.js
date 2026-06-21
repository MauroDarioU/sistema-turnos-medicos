// src/models/Usuario.js
//
// Modelo de Usuario con Mongoose, siguiendo el patrón visto en la clase 6
// (Implementación de operaciones CRUD en la API): definimos un Schema que
// describe la forma del documento, y luego lo convertimos en un modelo con
// mongoose.model().
//
// Decisiones de diseño relevantes para este proyecto:
//  - "rol" solo puede ser "admin" o "cliente" (enum), tal como pide la
//    consigna del proyecto.
//  - NUNCA guardamos la contraseña en texto plano: guardamos "salt" y "hash"
//    (ver src/utils/passwordUtils.js para el detalle del algoritmo).
//  - "email" es único: no puede haber dos usuarios con el mismo email.

const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede superar los 100 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Guardamos el salt y el hash en lugar de la contraseña en texto plano.
    salt: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      required: true,
    },
    rol: {
      type: String,
      enum: {
        values: ['admin', 'cliente'],
        message: 'El rol debe ser "admin" o "cliente"',
      },
      default: 'cliente',
    },
    // Campo opcional, útil si el usuario es un profesional de la salud y
    // necesitamos asociarlo con una especialidad concreta del sistema.
    especialidad: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true, // Agrega automáticamente createdAt y updatedAt
    collection: 'usuarios',
  }
);

// toJSON personalizado: cuando un Usuario se convierte a JSON (por ejemplo,
// al devolverlo en una respuesta HTTP), eliminamos el salt y el hash para
// que NUNCA se filtren esos datos sensibles al cliente, ni por accidente.
// Además, incluimos el id en formato string bajo la clave "id" (además del
// "_id" que Mongoose agrega por defecto), porque es más cómodo de consumir
// desde el front-end y desde el payload del JWT, donde usamos esa misma
// convención ({ id, email, rol, nombre }, ver usuarioService.js).
usuarioSchema.methods.toJSON = function () {
  const usuario = this.toObject();
  usuario.id = usuario._id.toString();
  delete usuario.salt;
  delete usuario.hash;
  delete usuario.__v;
  return usuario;
};

module.exports = mongoose.model('Usuario', usuarioSchema);
