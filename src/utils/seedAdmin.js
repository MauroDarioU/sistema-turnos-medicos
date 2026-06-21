// src/utils/seedAdmin.js
//
// Problema que resuelve este script: para crear un usuario con rol "admin"
// hay que llamar a POST /api/usuarios, pero esa ruta está protegida con
// soloRoles('admin')... ¿y si todavía no existe NINGÚN admin en el sistema?
//
// Es la clásica situación del "huevo o la gallina" en sistemas con
// autenticación por roles. La solución estándar (y la que usamos aquí) es
// tener un script de "seed" (semilla) que se ejecuta una sola vez, por
// fuera de la API HTTP, conectándose directamente a la base de datos para
// crear el primer administrador.
//
// Uso:
//   node src/utils/seedAdmin.js
//
// Lee el email/contraseña/nombre desde variables de entorno opcionales
// (SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NOMBRE) o usa valores
// por defecto pensados solo para desarrollo/demo.

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/config');
const Usuario = require('../models/Usuario');
const { crearCredenciales } = require('./passwordUtils');

async function seedAdmin() {
  await mongoose.connect(config.mongoUri);

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@turnosmedicos.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin12345';
  const nombre = process.env.SEED_ADMIN_NOMBRE || 'Administrador Inicial';
  const especialidad = process.env.SEED_ADMIN_ESPECIALIDAD || 'Clínica Médica';

  const yaExiste = await Usuario.findOne({ email });

  if (yaExiste) {
    console.log(`⚠️  Ya existe un usuario con el email ${email}. No se creó nada.`);
  } else {
    const { salt, hash } = crearCredenciales(password);

    await Usuario.create({
      nombre,
      email,
      salt,
      hash,
      rol: 'admin',
      especialidad,
    });

    console.log('✅ Administrador inicial creado correctamente:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('   ⚠️  Cambiá esta contraseña en un entorno real de producción.');
  }

  await mongoose.connection.close();
}

seedAdmin().catch((error) => {
  console.error('❌ Error al crear el administrador inicial:', error);
  process.exit(1);
});
