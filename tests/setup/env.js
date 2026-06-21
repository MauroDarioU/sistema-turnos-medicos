// tests/setup/env.js
//
// Variables de entorno usadas exclusivamente durante la ejecución de los
// tests. Las definimos ANTES de que cualquier archivo de la app llame a
// require('../config/config'), para asegurarnos de que use estos valores
// (en particular, NODE_ENV=test, que src/config/db.js usa para no llamar a
// process.exit() si la conexión a Mongo fallara).

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'clave-secreta-de-test';
process.env.JWT_EXPIRES_IN = '1h';
process.env.APP_HASH_SECRET = 'secreto-de-test';
// MONGO_URI se sobreescribe dinámicamente en tests/setup/db.js con la URI
// que genera mongodb-memory-server, así que no es necesario definirla aquí.
