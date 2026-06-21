// tests/integration/turnos.test.js
//
// Tests de integración del CRUD de turnos: cubren el flujo completo de
// casos de uso pedido por la consigna del proyecto (crear turno como
// cliente, ver historial propio, listar todos como admin con filtros,
// cambiar estado como admin, control de agenda, y control de acceso por rol).

const request = require('supertest');
const {
  conectarBaseDeDatosDePrueba,
  limpiarBaseDeDatosDePrueba,
  cerrarBaseDeDatosDePrueba,
} = require('../setup/db');

let app;

beforeAll(async () => {
  await conectarBaseDeDatosDePrueba();
  app = require('../../src/app');
});

afterEach(async () => {
  await limpiarBaseDeDatosDePrueba();
});

afterAll(async () => {
  await cerrarBaseDeDatosDePrueba();
});

/**
 * Función auxiliar de los tests: registra un cliente, lo loguea, y devuelve
 * su token + datos. La reutilizamos en varios tests para no repetir código
 * (principio DRY, mencionado también en la clase de buenas prácticas).
 */
async function crearClienteYObtenerToken(email = 'paciente@test.com') {
  await request(app).post('/api/auth/register').send({
    nombre: 'Paciente de Prueba',
    email,
    password: 'Password123',
  });

  const loginRespuesta = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Password123' });

  return {
    token: loginRespuesta.body.data.token,
    usuario: loginRespuesta.body.data.usuario,
  };
}

/**
 * Para crear un admin necesitamos otro admin ya existente (regla de
 * negocio del proyecto). Como en una base de datos de test recién creada
 * no hay NINGÚN admin todavía, insertamos uno directamente con el modelo
 * Mongoose, simulando la "semilla" inicial que en un entorno real se
 * cargaría manualmente o por script (ver README.md, sección "Primer
 * usuario administrador").
 */
async function crearAdminYObtenerToken(email = 'admin@test.com', especialidad = 'Cardiología') {
  const Usuario = require('../../src/models/Usuario');
  const { crearCredenciales } = require('../../src/utils/passwordUtils');

  const { salt, hash } = crearCredenciales('AdminPassword123');
  await Usuario.create({
    nombre: 'Admin de Prueba',
    email,
    salt,
    hash,
    rol: 'admin',
    especialidad,
  });

  const loginRespuesta = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'AdminPassword123' });

  return {
    token: loginRespuesta.body.data.token,
    usuario: loginRespuesta.body.data.usuario,
  };
}

describe('POST /api/turnos (crear turno)', () => {
  test('un cliente autenticado puede crear un turno válido', async () => {
    const { token } = await crearClienteYObtenerToken();
    const { usuario: admin } = await crearAdminYObtenerToken();

    const respuesta = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        profesional: admin.id,
        especialidad: 'Cardiología',
        fecha: '2026-07-01',
        hora: '10:30',
        motivoConsulta: 'Control anual',
      });

    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.body.data.estado).toBe('pendiente');
    expect(respuesta.body.data.especialidad).toBe('Cardiología');
  });

  test('rechaza la creación sin autenticación (401)', async () => {
    const respuesta = await request(app).post('/api/turnos').send({
      profesional: '64f000000000000000000000',
      especialidad: 'Cardiología',
      fecha: '2026-07-01',
      hora: '10:30',
    });

    expect(respuesta.statusCode).toBe(401);
  });

  test('rechaza fecha con formato inválido (400)', async () => {
    const { token } = await crearClienteYObtenerToken();
    const { usuario: admin } = await crearAdminYObtenerToken();

    const respuesta = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        profesional: admin.id,
        especialidad: 'Cardiología',
        fecha: '01-07-2026', // formato incorrecto, debería ser YYYY-MM-DD
        hora: '10:30',
      });

    expect(respuesta.statusCode).toBe(400);
  });

  test('no permite doble booking: dos turnos con el mismo profesional, fecha y hora', async () => {
    const { token: tokenPaciente1 } = await crearClienteYObtenerToken('paciente1@test.com');
    const { token: tokenPaciente2 } = await crearClienteYObtenerToken('paciente2@test.com');
    const { usuario: admin } = await crearAdminYObtenerToken();

    const datosTurno = {
      profesional: admin.id,
      especialidad: 'Cardiología',
      fecha: '2026-08-15',
      hora: '09:00',
    };

    const primeraRespuesta = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenPaciente1}`)
      .send(datosTurno);

    const segundaRespuesta = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenPaciente2}`)
      .send(datosTurno);

    expect(primeraRespuesta.statusCode).toBe(201);
    expect(segundaRespuesta.statusCode).toBe(400);
    expect(segundaRespuesta.body.error).toMatch(/ya tiene un turno/i);
  });

  test('rechaza la creación si el profesional no existe (400)', async () => {
    const { token } = await crearClienteYObtenerToken();

    const respuesta = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        profesional: '64f000000000000000000000', // ObjectId válido pero inexistente
        especialidad: 'Cardiología',
        fecha: '2026-07-01',
        hora: '10:30',
      });

    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.body.error).toMatch(/no existe/i);
  });
});

describe('GET /api/turnos/mis-turnos', () => {
  test('un cliente solo ve sus propios turnos, no los de otros pacientes', async () => {
    const { token: tokenPaciente1 } = await crearClienteYObtenerToken('paciente1@test.com');
    const { token: tokenPaciente2 } = await crearClienteYObtenerToken('paciente2@test.com');
    const { usuario: admin } = await crearAdminYObtenerToken();

    // Paciente 1 crea un turno.
    await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenPaciente1}`)
      .send({
        profesional: admin.id,
        especialidad: 'Pediatría',
        fecha: '2026-09-01',
        hora: '11:00',
      });

    // Paciente 2 consulta SU propio historial: debe estar vacío.
    const respuestaPaciente2 = await request(app)
      .get('/api/turnos/mis-turnos')
      .set('Authorization', `Bearer ${tokenPaciente2}`);

    expect(respuestaPaciente2.statusCode).toBe(200);
    expect(respuestaPaciente2.body.data).toHaveLength(0);

    // Paciente 1 consulta su propio historial: debe tener 1 turno.
    const respuestaPaciente1 = await request(app)
      .get('/api/turnos/mis-turnos')
      .set('Authorization', `Bearer ${tokenPaciente1}`);

    expect(respuestaPaciente1.body.data).toHaveLength(1);
  });
});

describe('GET /api/turnos (listado completo, solo admin)', () => {
  test('un cliente NO puede acceder al listado completo (403)', async () => {
    const { token } = await crearClienteYObtenerToken();

    const respuesta = await request(app)
      .get('/api/turnos')
      .set('Authorization', `Bearer ${token}`);

    expect(respuesta.statusCode).toBe(403);
  });

  test('un admin puede acceder al listado completo y filtrar por especialidad', async () => {
    const { token: tokenPaciente } = await crearClienteYObtenerToken();
    const { token: tokenAdmin, usuario: admin } = await crearAdminYObtenerToken();

    await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenPaciente}`)
      .send({
        profesional: admin.id,
        especialidad: 'Dermatología',
        fecha: '2026-10-01',
        hora: '15:00',
      });

    const respuesta = await request(app)
      .get('/api/turnos?especialidad=Dermatología')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data).toHaveLength(1);
    expect(respuesta.body.data[0].especialidad).toBe('Dermatología');
  });
});

describe('PUT /api/turnos/:id/estado', () => {
  test('un admin puede cambiar el estado de un turno', async () => {
    const { token: tokenPaciente } = await crearClienteYObtenerToken();
    const { token: tokenAdmin, usuario: admin } = await crearAdminYObtenerToken();

    const crearRespuesta = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenPaciente}`)
      .send({
        profesional: admin.id,
        especialidad: 'Clínica Médica',
        fecha: '2026-11-01',
        hora: '08:00',
      });

    const turnoId = crearRespuesta.body.data._id;

    const cambioRespuesta = await request(app)
      .put(`/api/turnos/${turnoId}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'confirmado' });

    expect(cambioRespuesta.statusCode).toBe(200);
    expect(cambioRespuesta.body.data.estado).toBe('confirmado');
  });

  test('un cliente NO puede cambiar el estado de un turno (403)', async () => {
    const { token: tokenPaciente } = await crearClienteYObtenerToken();
    const { usuario: admin } = await crearAdminYObtenerToken();

    const crearRespuesta = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenPaciente}`)
      .send({
        profesional: admin.id,
        especialidad: 'Clínica Médica',
        fecha: '2026-11-02',
        hora: '08:00',
      });

    const turnoId = crearRespuesta.body.data._id;

    const cambioRespuesta = await request(app)
      .put(`/api/turnos/${turnoId}/estado`)
      .set('Authorization', `Bearer ${tokenPaciente}`)
      .send({ estado: 'confirmado' });

    expect(cambioRespuesta.statusCode).toBe(403);
  });
});

describe('DELETE /api/turnos/:id (cancelar turno propio)', () => {
  test('un paciente puede cancelar su propio turno', async () => {
    const { token } = await crearClienteYObtenerToken();
    const { usuario: admin } = await crearAdminYObtenerToken();

    const crearRespuesta = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        profesional: admin.id,
        especialidad: 'Traumatología',
        fecha: '2026-12-01',
        hora: '16:00',
      });

    const turnoId = crearRespuesta.body.data._id;

    const cancelarRespuesta = await request(app)
      .delete(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelarRespuesta.statusCode).toBe(200);
    expect(cancelarRespuesta.body.data.estado).toBe('cancelado');
  });

  test('un paciente NO puede cancelar el turno de otro paciente (403)', async () => {
    const { token: tokenPaciente1 } = await crearClienteYObtenerToken('paciente1@test.com');
    const { token: tokenPaciente2 } = await crearClienteYObtenerToken('paciente2@test.com');
    const { usuario: admin } = await crearAdminYObtenerToken();

    const crearRespuesta = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenPaciente1}`)
      .send({
        profesional: admin.id,
        especialidad: 'Traumatología',
        fecha: '2026-12-02',
        hora: '16:00',
      });

    const turnoId = crearRespuesta.body.data._id;

    const cancelarRespuesta = await request(app)
      .delete(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${tokenPaciente2}`);

    expect(cancelarRespuesta.statusCode).toBe(403);
  });

  // El "doble booking" reutiliza el mismo horario una vez cancelado:
  // verificamos que cancelar un turno libera la agenda del profesional.
  test('cancelar un turno libera el horario para que otro paciente pueda reservarlo', async () => {
    const { token: tokenPaciente1 } = await crearClienteYObtenerToken('paciente1@test.com');
    const { token: tokenPaciente2 } = await crearClienteYObtenerToken('paciente2@test.com');
    const { usuario: admin } = await crearAdminYObtenerToken();

    const datosTurno = {
      profesional: admin.id,
      especialidad: 'Oftalmología',
      fecha: '2027-01-10',
      hora: '12:00',
    };

    const primerTurno = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenPaciente1}`)
      .send(datosTurno);

    await request(app)
      .delete(`/api/turnos/${primerTurno.body.data._id}`)
      .set('Authorization', `Bearer ${tokenPaciente1}`);

    const segundoTurno = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenPaciente2}`)
      .send(datosTurno);

    expect(segundoTurno.statusCode).toBe(201);
  });
});
