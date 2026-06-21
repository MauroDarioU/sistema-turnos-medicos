// src/config/db.js
//
// Módulo de conexión a la base de datos, tal como se vio en la clase 6
// (Implementación de operaciones CRUD en la API). Centralizamos la lógica de
// conexión a Mongoose en un solo lugar para no repetirla y para poder
// reutilizarla tanto en app.js como en los tests de integración.

const mongoose = require('mongoose');
const config = require('./config');

/**
 * Conecta la aplicación a MongoDB usando Mongoose.
 * Si la conexión falla, se registra el error y se finaliza el proceso,
 * ya que sin base de datos la API no puede operar.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log(`✅ Conectado a MongoDB en: ${config.mongoUri}`);
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    // En testing no queremos matar el proceso (jest se encarga de eso),
    // pero en ejecución normal sí, porque la app no tiene sentido sin BD.
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

/**
 * Cierra la conexión a la base de datos. Lo usamos principalmente al
 * finalizar la suite de tests de integración para liberar recursos.
 */
const disconnectDB = async () => {
  await mongoose.connection.close();
};

module.exports = { connectDB, disconnectDB };
