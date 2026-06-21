// src/app.js
//
// Punto de entrada principal de la aplicación. Aquí:
//  1. Configuramos Express y sus middlewares globales (CORS, JSON, estáticos,
//     responseHandler).
//  2. Conectamos a la base de datos.
//  3. Montamos las rutas de cada módulo bajo su prefijo correspondiente.
//  4. Registramos el errorHandler AL FINAL (siempre debe ser el último
//     middleware, como vimos en la clase de Middleware en Express).
//
// Esta estructura sigue el mismo esquema que armamos en la clase 6:
// app.js queda muy chico y legible porque toda la lógica está delegada en
// los demás archivos (routes, controllers, services, middlewares).

const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config/config');
const { connectDB } = require('./config/db');

const responseHandler = require('./middlewares/responseHandler');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const turnoRoutes = require('./routes/turnoRoutes');

const app = express();

// --- Middlewares globales ---

// CORS: permite que un front-end servido desde otro origen (por ejemplo,
// un puerto distinto durante el desarrollo) pueda consumir esta API.
app.use(cors());

// Parseo de JSON en el body de las solicitudes (equivalente a
// app.use(express.json()) que vimos desde la clase 4).
app.use(express.json());

// Respuestas estandarizadas: agrega res.success() y res.error() a TODAS
// las solicitudes, antes de llegar a cualquier ruta.
app.use(responseHandler);

// Servimos el front-end de prueba (HTML/CSS/JS plano) como contenido
// estático, igual que en el ejemplo de la clase 6.
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- Rutas de la API ---
// Cada módulo de rutas se monta bajo su propio prefijo, tal como
// recomienda la clase 4 (Manejo de dependencias y métodos REST en Express).
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/turnos', turnoRoutes);

// Ruta de salud / verificación rápida de que el servidor está vivo.
app.get('/api/health', (req, res) => {
  res.success({ mensaje: 'Servidor de Turnos Médicos funcionando correctamente' });
});

// --- Manejo de rutas no encontradas (404) ---
app.use((req, res) => {
  res.error('Recurso no encontrado', 404);
});

// --- Middleware de manejo de errores ---
// SIEMPRE al final: Express lo identifica por tener 4 parámetros.
app.use(errorHandler);

// Conectamos a la base de datos y, recién después, levantamos el servidor.
// Si exportáramos "app" sin conectar primero (como hacemos en los tests, ver
// tests/integration), el archivo de tests se encarga de la conexión.
if (require.main === module) {
  // Este "if" evita que el servidor se levante automáticamente cuando este
  // archivo es importado desde los tests (con supertest); solo arranca si
  // ejecutamos directamente "node src/app.js".
  connectDB().then(() => {
    app.listen(config.port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${config.port}`);
    });
  });
}

module.exports = app;
