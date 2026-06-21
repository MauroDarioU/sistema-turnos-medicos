// public/js/main.js
//
// Lógica de la interfaz: conecta los formularios del HTML con las
// funciones de api.js. Usamos async/await en todas las funciones que
// hacen fetch, tal como se explicó en la clase 6 ("async y await
// permiten escribir código asíncrono con una sintaxis mucho más clara").

// ---------- Utilidades de UI ----------

function mostrarMensaje(elementId, texto, esError = false) {
  const el = document.getElementById(elementId);
  el.textContent = texto;
  el.className = `mensaje ${esError ? 'error' : 'exito'}`;
}

function mostrar(elementId) {
  document.getElementById(elementId).classList.remove('oculto');
}

function ocultar(elementId) {
  document.getElementById(elementId).classList.add('oculto');
}

/**
 * Genera el HTML de un "badge" (etiqueta con color) para mostrar el estado
 * de un turno. Cada estado tiene un color con significado propio: ver el
 * comentario correspondiente en styles.css.
 */
function badgeEstado(estado) {
  return `<span class="badge-estado ${estado}">${estado}</span>`;
}

/**
 * Reemplaza el contenido de un <tbody> con un mensaje de "no hay datos
 * todavía", en lugar de dejarlo en blanco. cantidadColumnas determina el
 * colspan de la celda, para que el mensaje quede centrado en toda la fila.
 */
function mostrarEstadoVacio(tbody, cantidadColumnas, textoMensaje) {
  tbody.innerHTML = `
    <tr>
      <td colspan="${cantidadColumnas}">
        <div class="estado-vacio">
          <div class="icono-vacio">🗒️</div>
          <p>${textoMensaje}</p>
        </div>
      </td>
    </tr>
  `;
}

/**
 * Actualiza qué secciones de la pantalla se muestran según el rol del
 * usuario autenticado (o ninguno, si no hay sesión iniciada).
 */
function actualizarVistaSegunSesion() {
  const usuario = obtenerUsuarioActual();
  const sesionInfo = document.getElementById('sesionInfo');
  const btnLogout = document.getElementById('btnLogout');

  if (!usuario) {
    sesionInfo.textContent = '';
    btnLogout.style.display = 'none';
    ocultar('seccionSacarTurno');
    ocultar('seccionMisTurnos');
    ocultar('seccionAdminTurnos');
    ocultar('seccionAdminUsuarios');
    mostrar('seccionAuth');
    return;
  }

  sesionInfo.textContent = `${usuario.nombre} (${usuario.rol})`;
  btnLogout.style.display = 'inline-block';
  ocultar('seccionAuth');

  if (usuario.rol === 'cliente') {
    mostrar('seccionSacarTurno');
    mostrar('seccionMisTurnos');
    ocultar('seccionAdminTurnos');
    ocultar('seccionAdminUsuarios');
    cargarProfesionalesEnSelect();
    refrescarMisTurnos();
  } else if (usuario.rol === 'admin') {
    ocultar('seccionSacarTurno');
    ocultar('seccionMisTurnos');
    mostrar('seccionAdminTurnos');
    mostrar('seccionAdminUsuarios');
    refrescarTurnosAdmin();
  }
}

/**
 * Alterna entre el panel de "Registrarse" y el de "Iniciar sesión",
 * mostrando solo uno a la vez (como pestañas) y resaltando el botón
 * correspondiente como activo.
 */
function mostrarTabAuth(tab) {
  const panelRegistro = document.getElementById('panelRegistro');
  const panelLogin = document.getElementById('panelLogin');
  const tabRegistro = document.getElementById('tabRegistro');
  const tabLogin = document.getElementById('tabLogin');

  if (tab === 'registro') {
    panelRegistro.classList.remove('oculto');
    panelLogin.classList.add('oculto');
    tabRegistro.classList.add('activo');
    tabLogin.classList.remove('activo');
  } else {
    panelLogin.classList.remove('oculto');
    panelRegistro.classList.add('oculto');
    tabLogin.classList.add('activo');
    tabRegistro.classList.remove('activo');
  }
}

document.getElementById('tabRegistro').addEventListener('click', () => mostrarTabAuth('registro'));
document.getElementById('tabLogin').addEventListener('click', () => mostrarTabAuth('login'));

// ---------- Registro ----------

document.getElementById('formRegistro').addEventListener('submit', async (evento) => {
  evento.preventDefault();

  try {
    await api.registrar({
      nombre: document.getElementById('regNombre').value,
      email: document.getElementById('regEmail').value,
      password: document.getElementById('regPassword').value,
    });

    mostrarMensaje('mensajeRegistro', '¡Cuenta creada! Ya podés iniciar sesión.');
    document.getElementById('formRegistro').reset();
    mostrarTabAuth('login');
  } catch (error) {
    mostrarMensaje('mensajeRegistro', error.message, true);
  }
});

// ---------- Login ----------

document.getElementById('formLogin').addEventListener('submit', async (evento) => {
  evento.preventDefault();

  try {
    const resultado = await api.login({
      email: document.getElementById('loginEmail').value,
      password: document.getElementById('loginPassword').value,
    });

    guardarSesion(resultado.token, resultado.usuario);
    mostrarMensaje('mensajeLogin', `¡Bienvenido/a, ${resultado.usuario.nombre}!`);
    actualizarVistaSegunSesion();
  } catch (error) {
    mostrarMensaje('mensajeLogin', error.message, true);
  }
});

document.getElementById('btnLogout').addEventListener('click', () => {
  cerrarSesion();
  actualizarVistaSegunSesion();
});

// ---------- Sacar turno (cliente) ----------

async function cargarProfesionalesEnSelect() {
  try {
    const profesionales = await api.listarProfesionales();
    const select = document.getElementById('turnoProfesional');
    select.innerHTML = '';

    profesionales.forEach((profesional) => {
      const option = document.createElement('option');
      option.value = profesional._id;
      // Guardamos la especialidad en un data-attribute para poder leerla
      // después sin tener que volver a pedirle la lista completa a la API.
      option.dataset.especialidad = profesional.especialidad || '';
      option.textContent = `${profesional.nombre} (${profesional.especialidad || 'sin especialidad'})`;
      select.appendChild(option);
    });

    actualizarEspecialidadSegunProfesional();
  } catch (error) {
    console.error('Error al cargar profesionales:', error);
  }
}

/**
 * Completa el campo "Especialidad" (solo lectura) con la especialidad del
 * profesional actualmente seleccionado en el <select>. La especialidad
 * SIEMPRE depende del profesional elegido, nunca se escribe a mano: así
 * evitamos que alguien elija, por ejemplo, a un cardiólogo pero escriba
 * "Pediatría" en el campo de especialidad.
 */
function actualizarEspecialidadSegunProfesional() {
  const select = document.getElementById('turnoProfesional');
  const inputEspecialidad = document.getElementById('turnoEspecialidad');
  const opcionElegida = select.options[select.selectedIndex];

  inputEspecialidad.value = opcionElegida ? opcionElegida.dataset.especialidad : '';
}

document.getElementById('turnoProfesional').addEventListener('change', actualizarEspecialidadSegunProfesional);

document.getElementById('formTurno').addEventListener('submit', async (evento) => {
  evento.preventDefault();

  try {
    await api.crearTurno({
      profesional: document.getElementById('turnoProfesional').value,
      especialidad: document.getElementById('turnoEspecialidad').value,
      fecha: document.getElementById('turnoFecha').value,
      hora: document.getElementById('turnoHora').value,
      motivoConsulta: document.getElementById('turnoMotivo').value,
    });

    mostrarMensaje('mensajeTurno', '¡Turno solicitado correctamente!');
    document.getElementById('formTurno').reset();
    actualizarEspecialidadSegunProfesional();
    refrescarMisTurnos();
  } catch (error) {
    mostrarMensaje('mensajeTurno', error.message, true);
  }
});

// ---------- Mis turnos (cliente) ----------

async function refrescarMisTurnos() {
  try {
    const turnos = await api.misTurnos();
    const tbody = document.querySelector('#tablaMisTurnos tbody');

    if (turnos.length === 0) {
      mostrarEstadoVacio(tbody, 6, 'Todavía no tenés turnos. ¡Sacá el primero arriba!');
      return;
    }

    tbody.innerHTML = '';

    turnos.forEach((turno) => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${turno.fecha}</td>
        <td>${turno.hora}</td>
        <td>${turno.especialidad}</td>
        <td>${turno.profesional?.nombre || '-'}</td>
        <td>${badgeEstado(turno.estado)}</td>
        <td></td>
      `;

      // Solo permitimos cancelar turnos que no estén ya cancelados/completados.
      if (turno.estado === 'pendiente' || turno.estado === 'confirmado') {
        const botonCancelar = document.createElement('button');
        botonCancelar.textContent = 'Cancelar';
        botonCancelar.className = 'btn-acento';
        botonCancelar.addEventListener('click', async () => {
          try {
            await api.cancelarTurno(turno._id);
            refrescarMisTurnos();
          } catch (error) {
            alert(error.message);
          }
        });
        fila.lastElementChild.appendChild(botonCancelar);
      }

      tbody.appendChild(fila);
    });
  } catch (error) {
    console.error('Error al cargar mis turnos:', error);
  }
}

document.getElementById('btnRefrescarMisTurnos').addEventListener('click', refrescarMisTurnos);

// ---------- Administración de turnos (admin) ----------

async function refrescarTurnosAdmin() {
  const filtros = {
    especialidad: document.getElementById('filtroEspecialidad').value,
    estado: document.getElementById('filtroEstado').value,
  };

  // Quitamos filtros vacíos para no mandarlos en la query string.
  Object.keys(filtros).forEach((clave) => {
    if (!filtros[clave]) delete filtros[clave];
  });

  try {
    const turnos = await api.listarTodosLosTurnos(filtros);
    const tbody = document.querySelector('#tablaAdminTurnos tbody');

    if (turnos.length === 0) {
      mostrarEstadoVacio(tbody, 7, 'No se encontraron turnos con esos filtros.');
      return;
    }

    tbody.innerHTML = '';

    turnos.forEach((turno) => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${turno.fecha}</td>
        <td>${turno.hora}</td>
        <td>${turno.especialidad}</td>
        <td>${turno.paciente?.nombre || '-'}</td>
        <td>${turno.profesional?.nombre || '-'}</td>
        <td>${badgeEstado(turno.estado)}</td>
        <td></td>
      `;

      const select = document.createElement('select');
      select.className = 'estado-select';
      ['pendiente', 'confirmado', 'cancelado', 'completado'].forEach((estado) => {
        const option = document.createElement('option');
        option.value = estado;
        option.textContent = estado;
        if (estado === turno.estado) option.selected = true;
        select.appendChild(option);
      });

      select.addEventListener('change', async () => {
        try {
          await api.cambiarEstadoTurno(turno._id, select.value);
          refrescarTurnosAdmin();
        } catch (error) {
          alert(error.message);
        }
      });

      fila.lastElementChild.appendChild(select);
      tbody.appendChild(fila);
    });
  } catch (error) {
    console.error('Error al cargar turnos (admin):', error);
  }
}

document.getElementById('btnFiltrarTurnos').addEventListener('click', refrescarTurnosAdmin);

// ---------- Alta de profesionales (admin) ----------

document.getElementById('formCrearProfesional').addEventListener('submit', async (evento) => {
  evento.preventDefault();

  try {
    await api.crearProfesional({
      nombre: document.getElementById('profNombre').value,
      email: document.getElementById('profEmail').value,
      password: document.getElementById('profPassword').value,
      especialidad: document.getElementById('profEspecialidad').value,
    });

    mostrarMensaje('mensajeProfesional', 'Profesional creado correctamente.');
    document.getElementById('formCrearProfesional').reset();
  } catch (error) {
    mostrarMensaje('mensajeProfesional', error.message, true);
  }
});

// ---------- Inicialización ----------
actualizarVistaSegunSesion();
