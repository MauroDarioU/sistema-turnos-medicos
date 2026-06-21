// public/js/api.js
//
// Pequeña capa que envuelve fetch(), tal como se vio en la clase 6
// (Implementación de operaciones CRUD en la API): centralizamos aquí la
// lógica de construir la URL, agregar el header de Authorization con el
// token JWT, y parsear la respuesta JSON. Así, en main.js, las funciones
// que manejan la UI quedan mucho más simples y legibles.

const BASE_URL = '/api';

/**
 * Devuelve el token JWT guardado en memoria (variable global del módulo).
 * NOTA IMPORTANTE: en una aplicación de producción, normalmente el token
 * se guardaría en localStorage para persistir entre recargas de página
 * (como vimos en la clase de "Persistencia de datos en el cliente"). Para
 * esta demo simple lo mantenemos en una variable de JavaScript, así que al
 * recargar la página hay que volver a loguearse. Se deja comentado abajo
 * cómo se haría con localStorage, a modo de referencia.
 */
let tokenActual = null;
let usuarioActual = null;

function guardarSesion(token, usuario) {
  tokenActual = token;
  usuarioActual = usuario;
  // localStorage.setItem('token', token); // Alternativa con persistencia
}

function obtenerToken() {
  return tokenActual;
}

function obtenerUsuarioActual() {
  return usuarioActual;
}

function cerrarSesion() {
  tokenActual = null;
  usuarioActual = null;
}

/**
 * Función central de llamadas a la API. Construye los headers, agrega el
 * token si existe, y devuelve el JSON ya parseado.
 *
 * @param {string} endpoint - Ej: '/auth/login'
 * @param {object} opciones - { method, body }
 */
async function apiFetch(endpoint, opciones = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (tokenActual) {
    headers['Authorization'] = `Bearer ${tokenActual}`;
  }

  const respuesta = await fetch(`${BASE_URL}${endpoint}`, {
    method: opciones.method || 'GET',
    headers,
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    // Las respuestas de error de nuestra API (gracias a responseHandler)
    // siempre tienen la forma { success: false, error: "...", details: [...] }
    const detalle = Array.isArray(datos.details) ? datos.details.join(', ') : '';
    throw new Error(detalle ? `${datos.error}: ${detalle}` : datos.error);
  }

  return datos.data;
}

const api = {
  registrar: (datos) => apiFetch('/auth/register', { method: 'POST', body: datos }),
  login: (datos) => apiFetch('/auth/login', { method: 'POST', body: datos }),
  perfil: () => apiFetch('/auth/perfil'),

  listarProfesionales: () => apiFetch('/usuarios/profesionales'),
  crearProfesional: (datos) =>
    apiFetch('/usuarios', { method: 'POST', body: { ...datos, rol: 'admin' } }),

  crearTurno: (datos) => apiFetch('/turnos', { method: 'POST', body: datos }),
  misTurnos: () => apiFetch('/turnos/mis-turnos'),
  cancelarTurno: (id) => apiFetch(`/turnos/${id}`, { method: 'DELETE' }),

  listarTodosLosTurnos: (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    return apiFetch(`/turnos${params ? `?${params}` : ''}`);
  },
  cambiarEstadoTurno: (id, estado) =>
    apiFetch(`/turnos/${id}/estado`, { method: 'PUT', body: { estado } }),
};
