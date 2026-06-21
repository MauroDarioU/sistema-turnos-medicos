// src/utils/seedDatosDemo.js
//
// Script de "semilla" para poblar la base de datos con datos de prueba
// realistas, pensado para tener un sistema con contenido antes de grabar
// la demo (en vez de arrancar de cero y tener que registrar todo a mano
// en vivo). Sigue el mismo patrón que seedAdmin.js: se conecta directo a
// la base de datos, por fuera de la API HTTP, porque crear usuarios con
// rol "admin" requiere ya tener un admin autenticado (ver el comentario
// completo de esa situación en seedAdmin.js).
//
// Uso:
//   node src/utils/seedDatosDemo.js
//
// Es seguro ejecutarlo más de una vez: si un usuario con determinado email
// ya existe, el script lo detecta y lo saltea en vez de duplicarlo o fallar.

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/config');
const Usuario = require('../models/Usuario');
const { crearCredenciales } = require('./passwordUtils');

// Contraseña única para todos los usuarios de prueba, para que sea fácil
// loguearse con cualquiera de ellos durante una demo en vivo.
const PASSWORD_DEMO = 'Password123';

// Lista de profesionales agrupados por especialidad. Los nombres son
// ficticios, pensados solo para que la demo se vea con contenido variado.
const PROFESIONALES_POR_ESPECIALIDAD = {
  Cardiología: ['Laura Fernández', 'Martín Suárez', 'Carla Domínguez'],
  Pediatría: ['Sofía Ramírez', 'Diego Acosta', 'Valeria Molina'],
  Dermatología: ['Pablo Ibáñez', 'Romina Castro'],
  'Clínica Médica': ['Hernán Ortiz', 'Gabriela Núñez', 'Federico Paz'],
  Traumatología: ['Lucas Benítez', 'Marina Sosa'],
  Oftalmología: ['Adrián Vega'],
  Ginecología: ['Patricia Luna', 'Florencia Rojas'],
  Neurología: ['Ezequiel Torres', 'Camila Aguirre'],
  Psiquiatría: ['Nicolás Herrera', 'Belén Cabrera'],
  Otorrinolaringología: ['Julián Medina'],
  Nutrición: ['Agustina Flores', 'Tomás Navarro'],
  Laboratorio: ['Mariana Quiroga', 'Esteban Salas', 'Lucía Ferreyra'],
};

// Pacientes de prueba (rol "cliente"), para tener un par de cuentas listas
// para mostrar el flujo de "sacar un turno" sin tener que registrarse en vivo.
const PACIENTES_DEMO = [
  { nombre: 'Juan Pérez', email: 'juan.perez@demo.com' },
  { nombre: 'María García', email: 'maria.garcia@demo.com' },
  { nombre: 'Carlos López', email: 'carlos.lopez@demo.com' },
  { nombre: 'Ana Martínez', email: 'ana.martinez@demo.com' },
  { nombre: 'Pedro Sánchez', email: 'pedro.sanchez@demo.com' },
  { nombre: 'Lucía Romero', email: 'lucia.romero@demo.com' },
  { nombre: 'Roberto Díaz', email: 'roberto.diaz@demo.com' },
  { nombre: 'Sandra Torres', email: 'sandra.torres@demo.com' },
];

/**
 * Convierte "Laura Fernández" en un email simple y predecible:
 * "laura.fernandez@turnosmedicos.com". Le quitamos los acentos para que el
 * email sea válido y fácil de tipear durante la demo.
 */
function generarEmailDesdeNombre(nombreCompleto, dominio) {
  const sinAcentos = nombreCompleto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // quita tildes (diacríticos)

  const partes = sinAcentos.split(' ').join('.');
  return `${partes}@${dominio}`;
}

/**
 * Crea un usuario si no existe todavía (buscado por email). Si ya existe,
 * lo saltea para que el script se pueda correr varias veces sin duplicar
 * datos ni romper por el índice "unique" del email.
 */
async function crearUsuarioSiNoExiste({ nombre, email, rol, especialidad }) {
  const yaExiste = await Usuario.findOne({ email });

  if (yaExiste) {
    console.log(`   ⏭️  Ya existe: ${email} (se saltea)`);
    return;
  }

  const { salt, hash } = crearCredenciales(PASSWORD_DEMO);

  await Usuario.create({
    nombre,
    email,
    salt,
    hash,
    rol,
    especialidad: especialidad || null,
  });

  console.log(`   ✅ Creado: ${nombre} <${email}> (${rol}${especialidad ? `, ${especialidad}` : ''})`);
}

async function seedDatosDemo() {
  await mongoose.connect(config.mongoUri);

  console.log('--- Creando profesionales por especialidad ---');
  for (const [especialidad, nombres] of Object.entries(PROFESIONALES_POR_ESPECIALIDAD)) {
    console.log(`\n${especialidad}:`);
    for (const nombre of nombres) {
      const email = generarEmailDesdeNombre(nombre, 'turnosmedicos.com');
      await crearUsuarioSiNoExiste({ nombre, email, rol: 'admin', especialidad });
    }
  }

  console.log('\n--- Creando pacientes de prueba ---');
  for (const paciente of PACIENTES_DEMO) {
    await crearUsuarioSiNoExiste({
      nombre: paciente.nombre,
      email: paciente.email,
      rol: 'cliente',
    });
  }

  const totalProfesionales = Object.values(PROFESIONALES_POR_ESPECIALIDAD).flat().length;

  console.log('\n========================================');
  console.log('✅ Seed de datos de demo finalizado.');
  console.log(`   Profesionales: ${totalProfesionales}`);
  console.log(`   Pacientes: ${PACIENTES_DEMO.length}`);
  console.log(`   Contraseña para TODOS los usuarios de demo: ${PASSWORD_DEMO}`);
  console.log('========================================');

  await mongoose.connection.close();
}

seedDatosDemo().catch((error) => {
  console.error('❌ Error al crear los datos de demo:', error);
  process.exit(1);
});
