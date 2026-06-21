// tests/setup/db.js
//
// Helper para tests de integración: en vez de exigir que el alumno tenga
// MongoDB corriendo localmente para poder ejecutar "npm test", usamos
// "mongodb-memory-server", una librería que levanta una instancia de
// MongoDB temporal, 100% en memoria, solo para la duración de los tests.
//
// Esto es coherente con lo que vimos en la clase 10 sobre testing de
// integración: "verificar que los distintos componentes del sistema
// funcionen correctamente cuando se combinan" (en este caso: Express +
// Mongoose + MongoDB real, aunque sea una instancia temporal).

require('./env'); // Aseguramos que las variables de entorno de test estén seteadas primero.

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Levanta el servidor de MongoDB en memoria y conecta Mongoose a él.
 * Se debe llamar en un beforeAll() de cada archivo de test de integración.
 */
async function conectarBaseDeDatosDePrueba() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
}

/**
 * Limpia todas las colecciones de la base de datos de prueba. Se debe
 * llamar en un beforeEach() o afterEach() para que los tests no se
 * "contaminen" entre sí con datos de tests anteriores (recordemos la clase
 * 10: "los tests deben ser deterministas").
 */
async function limpiarBaseDeDatosDePrueba() {
  const colecciones = mongoose.connection.collections;
  for (const nombreColeccion in colecciones) {
    await colecciones[nombreColeccion].deleteMany({});
  }
}

/**
 * Cierra la conexión y detiene el servidor de MongoDB en memoria. Se debe
 * llamar en un afterAll() para liberar recursos al finalizar la suite.
 */
async function cerrarBaseDeDatosDePrueba() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
}

module.exports = {
  conectarBaseDeDatosDePrueba,
  limpiarBaseDeDatosDePrueba,
  cerrarBaseDeDatosDePrueba,
};
