// tests/integration/auth.test.js
//
// Tests de INTEGRACIÓN (clase 10): a diferencia de los tests unitarios, acá
// usamos Supertest para simular peticiones HTTP reales contra nuestra app
// de Express completa (rutas + middlewares + controladores + servicios +
// base de datos en memoria), sin necesidad de levantar el servidor en un
// puerto real.

const request = require('supertest');
const {
  conectarBaseDeDatosDePrueba,
  limpiarBaseDeDatosDePrueba,
  cerrarBaseDeDatosDePrueba,
} = require('../setup/db');

let app;

beforeAll(async () => {
  await conectarBaseDeDatosDePrueba();
  // Importamos la app DESPUÉS de conectar la base de datos en memoria, para
  // asegurarnos de que cuando Mongoose haga sus operaciones ya exista una
  // conexión activa.
  app = require('../../src/app');
});

afterEach(async () => {
  await limpiarBaseDeDatosDePrueba();
});

afterAll(async () => {
  await cerrarBaseDeDatosDePrueba();
});

describe('POST /api/auth/register', () => {
  test('registra un usuario válido y responde 201 con sus datos (sin password)', async () => {
    const respuesta = await request(app).post('/api/auth/register').send({
      nombre: 'Juan Pérez',
      email: 'juan@test.com',
      password: 'Password123',
    });

    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.body.success).toBe(true);
    expect(respuesta.body.data.email).toBe('juan@test.com');
    expect(respuesta.body.data.rol).toBe('cliente'); // Forzado, aunque no se pidió.
    // Nunca debe filtrarse el salt ni el hash en la respuesta:
    expect(respuesta.body.data.salt).toBeUndefined();
    expect(respuesta.body.data.hash).toBeUndefined();
  });

  test('rechaza el registro si falta el nombre (400)', async () => {
    const respuesta = await request(app).post('/api/auth/register').send({
      email: 'sinnombre@test.com',
      password: 'Password123',
    });

    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.body.success).toBe(false);
  });

  test('rechaza el registro si el email ya está en uso (409, por índice unique)', async () => {
    const datosUsuario = {
      nombre: 'Repetido',
      email: 'repetido@test.com',
      password: 'Password123',
    };

    await request(app).post('/api/auth/register').send(datosUsuario);
    const segundaRespuesta = await request(app)
      .post('/api/auth/register')
      .send(datosUsuario);

    expect(segundaRespuesta.statusCode).toBe(409);
  });

  test('rechaza una contraseña demasiado corta (400)', async () => {
    const respuesta = await request(app).post('/api/auth/register').send({
      nombre: 'Test',
      email: 'corta@test.com',
      password: '123',
    });

    expect(respuesta.statusCode).toBe(400);
  });

  test('ignora/rechaza si se intenta especificar rol "admin" en el registro público', async () => {
    const respuesta = await request(app).post('/api/auth/register').send({
      nombre: 'Intento Admin',
      email: 'intentoadmin@test.com',
      password: 'Password123',
      rol: 'admin',
    });

    // El validador rechaza explícitamente el campo "rol" en este endpoint.
    expect(respuesta.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      nombre: 'Usuario Login',
      email: 'login@test.com',
      password: 'Password123',
    });
  });

  test('devuelve un token JWT con credenciales correctas', async () => {
    const respuesta = await request(app).post('/api/auth/login').send({
      email: 'login@test.com',
      password: 'Password123',
    });

    expect(respuesta.statusCode).toBe(200);
    expect(typeof respuesta.body.data.token).toBe('string');
    expect(respuesta.body.data.usuario.email).toBe('login@test.com');
  });

  test('devuelve 401 con contraseña incorrecta', async () => {
    const respuesta = await request(app).post('/api/auth/login').send({
      email: 'login@test.com',
      password: 'ContraseñaIncorrecta',
    });

    expect(respuesta.statusCode).toBe(401);
  });

  test('devuelve 401 con un email que no existe', async () => {
    const respuesta = await request(app).post('/api/auth/login').send({
      email: 'noexiste@test.com',
      password: 'Password123',
    });

    expect(respuesta.statusCode).toBe(401);
  });
});

describe('GET /api/auth/perfil (ruta privada)', () => {
  test('devuelve 401 si no se envía token', async () => {
    const respuesta = await request(app).get('/api/auth/perfil');
    expect(respuesta.statusCode).toBe(401);
  });

  test('devuelve los datos del usuario si el token es válido', async () => {
    await request(app).post('/api/auth/register').send({
      nombre: 'Con Perfil',
      email: 'perfil@test.com',
      password: 'Password123',
    });

    const loginRespuesta = await request(app).post('/api/auth/login').send({
      email: 'perfil@test.com',
      password: 'Password123',
    });

    const token = loginRespuesta.body.data.token;

    const perfilRespuesta = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${token}`);

    expect(perfilRespuesta.statusCode).toBe(200);
    expect(perfilRespuesta.body.data.email).toBe('perfil@test.com');
  });

  test('devuelve 401 si el token está alterado', async () => {
    await request(app).post('/api/auth/register').send({
      nombre: 'Con Perfil 2',
      email: 'perfil2@test.com',
      password: 'Password123',
    });

    const loginRespuesta = await request(app).post('/api/auth/login').send({
      email: 'perfil2@test.com',
      password: 'Password123',
    });

    const tokenAlterado = loginRespuesta.body.data.token + 'x';

    const perfilRespuesta = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${tokenAlterado}`);

    expect(perfilRespuesta.statusCode).toBe(401);
  });
});
