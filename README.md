# 🏥 Sistema de Turnos Médicos

API REST para la gestión de turnos médicos, desarrollada como proyecto final de **Programación 2**. Implementa registro y login de usuarios, autenticación con JWT, control de acceso por roles, CRUD completo de turnos, validación de datos, manejo centralizado de errores, Clean Architecture y testing automatizado con Jest + Supertest.

Este documento explica **qué hace cada parte del código y por qué**, para que se pueda entender, defender y exponer en la demo.

---

## 1. Tecnologías utilizadas

| Tecnología | Uso en el proyecto |
|---|---|
| **Node.js + Express** | Servidor HTTP y framework para definir la API REST. |
| **MongoDB + Mongoose** | Base de datos NoSQL y ODM para modelar Usuarios y Turnos. |
| **jsonwebtoken (JWT)** | Autenticación basada en tokens, sin guardar sesiones en el servidor. |
| **crypto (nativo de Node)** | Hashing de contraseñas con HMAC-SHA256 + salt (sin librerías externas de hashing). |
| **express-validator** | Validación y sanitización de los datos que llegan en cada request. |
| **cors** | Habilita que el front-end consuma la API desde otro origen/puerto. |
| **dotenv** | Manejo de variables de entorno (`.env`). |
| **Jest + Supertest** | Testing unitario y de integración. |
| **mongodb-memory-server** | Permite correr los tests de integración sin necesidad de tener Mongo instalado: levanta una base de datos temporal en memoria solo durante los tests. |
| **HTML / CSS / JS plano** | Front-end mínimo de prueba, sin frameworks, para poder probar todo desde el navegador. |

Todas estas tecnologías y patrones fueron vistos a lo largo de las 12 clases de la materia; en la sección 6 de este documento se detalla, clase por clase, qué se aplicó.

---

## 2. Cómo correr el proyecto

### Requisitos previos
- Node.js (v18 o superior recomendado).
- MongoDB corriendo localmente (`mongod`), en Docker, o una base en MongoDB Atlas.

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de variables de entorno a partir del ejemplo
cp .env.example .env
# Editar .env con tus propios valores (especialmente MONGO_URI y los secrets)

# 3. (Solo la primera vez) Crear el primer usuario administrador
npm run seed:admin
# Esto crea: admin@turnosmedicos.com / Admin12345 (podés cambiarlo con
# variables de entorno SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD, ver el script
# en src/utils/seedAdmin.js)

# 4. Levantar el servidor
npm start
# o, en modo desarrollo con reinicio automático:
npm run dev
```

El servidor queda escuchando en `http://localhost:3000` (o el puerto que definas en `PORT`). El front-end de prueba se sirve automáticamente en `http://localhost:3000/`.

### Correr los tests

```bash
npm test
```

Los tests usan `mongodb-memory-server`, por lo que **no necesitás tener Mongo corriendo** para ejecutarlos: se levanta y se destruye una base de datos temporal automáticamente.

---

## 3. ¿Por qué existe un script `seed:admin`?

Hay una regla de seguridad importante en este proyecto: **el endpoint público de registro (`/api/auth/register`) siempre crea usuarios con rol "cliente"**, nunca "admin". Esto evita que cualquier persona se autoasigne permisos de administrador completando un formulario.

Pero entonces aparece el clásico problema del "huevo o la gallina": para crear un usuario con rol "admin" hace falta llamar a `POST /api/usuarios`, que está protegido y solo lo puede usar... un admin. ¿Cómo se crea el primero?

La solución estándar (y la que usamos acá) es un **script de semilla** (`src/utils/seedAdmin.js`) que se conecta directamente a la base de datos, por fuera de la API HTTP, y crea el primer administrador. Se ejecuta una sola vez, manualmente, con `npm run seed:admin`. A partir de ahí, ese primer admin ya puede loguearse y crear otros admins/profesionales desde la API normalmente.

---

## 4. Estructura del proyecto (Clean Architecture)

```
sistema-turnos-medicos/
├── src/
│   ├── app.js                  # Punto de entrada: configura Express y conecta todo
│   ├── config/
│   │   ├── config.js           # Lee y centraliza las variables de entorno
│   │   └── db.js                # Conexión a MongoDB con Mongoose
│   ├── models/                 # "Entidades": forma de los datos (Mongoose Schemas)
│   │   ├── Usuario.js
│   │   └── Turno.js
│   ├── services/               # "Casos de uso": la lógica de negocio
│   │   ├── jwtService.js        # Generar/verificar tokens JWT
│   │   ├── usuarioService.js    # Registro, login, creación de usuarios con rol
│   │   └── turnoService.js      # Crear, listar, cambiar estado, cancelar turnos
│   ├── controllers/             # "Interfaces": traducen HTTP <-> lógica de negocio
│   │   ├── authController.js
│   │   ├── usuarioController.js
│   │   └── turnoController.js
│   ├── routes/                  # Definición de endpoints y qué middlewares aplican
│   │   ├── authRoutes.js
│   │   ├── usuarioRoutes.js
│   │   └── turnoRoutes.js
│   ├── middlewares/
│   │   ├── responseHandler.js   # Agrega res.success() / res.error()
│   │   ├── errorHandler.js      # Manejo centralizado de errores
│   │   ├── authMiddleware.js    # Verifica el JWT (autenticación)
│   │   ├── roleMiddleware.js    # Verifica el rol (autorización)
│   │   └── validators/          # Reglas de express-validator + su manejo
│   └── utils/
│       ├── passwordUtils.js     # Hashing de contraseñas (HMAC + salt)
│       └── seedAdmin.js         # Script para crear el primer admin
├── public/                      # Front-end de prueba (HTML/CSS/JS plano)
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── api.js               # Envoltorio de fetch() hacia la API
│       └── main.js              # Lógica de la interfaz
├── tests/
│   ├── unit/                    # Tests de funciones aisladas
│   ├── integration/             # Tests de la API completa (con Supertest)
│   └── setup/                   # Helpers para los tests (DB en memoria, env vars)
├── .env.example
├── .gitignore
└── package.json
```

Esta organización sigue el esquema de **Clean Architecture** explicado en clase: cada capa tiene una sola responsabilidad y las dependencias van de "afuera hacia adentro".

- **Models** (Entidades): solo describen la forma de los datos. No saben nada de HTTP ni de reglas de negocio complejas.
- **Services** (Casos de uso): toda la lógica de negocio vive aquí. Por ejemplo, "no se puede crear un turno si el profesional ya tiene uno asignado en ese horario" es una regla que vive en `turnoService.js`, no en el controlador ni en el modelo.
- **Controllers + Routes** (Interfaces/Adapters): conectan el mundo HTTP con los servicios. Un controlador nunca debería tener lógica de negocio compleja: solo lee `req`, llama al servicio correspondiente, y devuelve una respuesta con `res.success()` / `res.error()`.
- **Middlewares**: funciones transversales (autenticación, autorización, validación, manejo de errores) que se ejecutan antes o después de las rutas.

---

## 5. Decisiones de diseño importantes (para poder explicarlas en la demo)

### 5.1. ¿Por qué los "profesionales" son usuarios con rol "admin"?

La consigna del proyecto define explícitamente dos roles: **admin** y **cliente**. No se pide un tercer rol "profesional". Para no salirme de ese alcance, modelé a los profesionales de la salud como usuarios con `rol: "admin"` que además tienen el campo `especialidad` completo (ver `src/models/Usuario.js`).

Esto es una simplificación consciente: en un sistema real, probablemente un profesional de la salud NO debería tener los mismos permisos administrativos que quien gestiona todo el sistema (son responsabilidades distintas). Una mejora a futuro sería agregar un tercer rol `profesional`, con sus propios permisos (por ejemplo: puede ver y confirmar sus propios turnos, pero no los de otros profesionales ni gestionar usuarios). Lo dejo señalado en el código (`turnoService.js`, comentario de `crearTurno`) para que quede claro que es una decisión de diseño, no un descuido.

### 5.2. ¿Por qué se guarda `salt` + `hash` en lugar de "password"?

Siguiendo la clase de Seguridad en Aplicaciones Web: las contraseñas **nunca** se guardan en texto plano. Usamos el módulo nativo `crypto` de Node con la técnica **HMAC-SHA256 + salt**:

- Cada usuario tiene un `salt` aleatorio distinto (`crypto.randomBytes`).
- El hash se calcula con `crypto.createHmac('sha256', salt + secretoDeAplicacion).update(password).digest('hex')`.
- Para verificar el login, se recalcula el hash con el mismo salt y se compara con `crypto.timingSafeEqual` (en vez de `===`), para evitar timing attacks.

Todo el detalle está comentado paso a paso en `src/utils/passwordUtils.js`.

### 5.3. ¿Por qué el registro público fuerza el rol "cliente"?

Si dejáramos que cualquiera mande `{ "rol": "admin" }` en el body de `/api/auth/register`, cualquier persona podría auto-otorgarse permisos de administrador. Por eso:
- El validador (`usuarioValidator.js`) rechaza explícitamente la solicitud si el campo `rol` está presente en el body de registro.
- El servicio (`usuarioService.registrarUsuario`) además fuerza `rol: 'cliente'` como segunda capa de seguridad, incluso si alguien lograra esquivar la validación.

Crear administradores o profesionales solo es posible: (a) con el script `seedAdmin.js` para el primer admin, o (b) con `POST /api/usuarios`, que está protegido y solo puede ejecutarlo un admin ya autenticado.

### 5.4. ¿Por qué cancelar un turno no lo borra de la base de datos?

`DELETE /api/turnos/:id` no hace un borrado físico: cambia el campo `estado` a `"cancelado"`. Esto preserva el historial completo (importante en un sistema médico, donde puede ser relevante saber que un paciente canceló una consulta) y es la práctica estándar en sistemas de este tipo ("soft delete").

### 5.5. ¿Por qué fecha y hora se guardan como String y no como Date?

Para mantenernos dentro del alcance de la materia y evitar la complejidad de manejar zonas horarias (un tema que excede el contenido visto en clase), guardamos `fecha` como `"YYYY-MM-DD"` y `hora` como `"HH:MM"`, ambos validados con expresiones regulares tanto en el modelo de Mongoose como en `express-validator`. Esto simplifica las comparaciones (por ejemplo, para detectar si un profesional ya tiene un turno en un horario dado) sin perder claridad.

---

## 6. Cómo se conecta cada clase de la materia con el código

| Clase | Tema | Dónde se aplica en este proyecto |
|---|---|---|
| 1 | Buenas prácticas, nombrado de variables | Nombres descriptivos en todo el proyecto (`crearTurno`, `validarPassword`, etc.), comentarios explicativos. |
| 2 | Node.js, entorno | `package.json`, scripts `npm start` / `npm run dev`. |
| 3 | Patrones de desarrollo, REST | Diseño de endpoints siguiendo convenciones REST (`GET /api/turnos`, `POST /api/turnos`, etc.), uso correcto de los métodos HTTP. |
| 4 | Dependencias, organización en Express | Estructura de carpetas `controllers/middlewares/models/routes/services/config`, exactamente la organización vista en clase. |
| 5 | MongoDB, persistencia | Modelos con Mongoose, conexión centralizada en `config/db.js`. |
| 6 | CRUD en la API | `responseHandler.js`, `errorHandler.js`, `express-validator`, organización de rutas/controladores/modelos con Mongoose. |
| 7 | Seguridad en aplicaciones web | Hashing de contraseñas con `crypto` (HMAC + salt), CORS. |
| 8 | Autenticación y autorización | JWT con `jsonwebtoken`, `authMiddleware.js`, `roleMiddleware.js`, organización en `services/jwtService.js`. |
| 9 | Persistencia en el cliente, integración front-end | Front-end en `public/` que consume la API con `fetch()`, comentarios sobre alternativas con `localStorage`. |
| 10 | Testing | Tests unitarios y de integración con Jest + Supertest, organizados en `tests/unit` y `tests/integration`, siguiendo las convenciones de nombrado (`*.test.js`) y buenas prácticas (un comportamiento por test, nombres descriptivos, mocks de la base de datos). |
| 11 | Despliegue en la nube | Variables de entorno (`.env` / `.env.example`) listas para configurarse en cualquier proveedor cloud (Render, Railway, Fly.io, etc.) sin tocar el código. |
| 12 | Metodologías ágiles | Ver sección de "Hitos de desarrollo" más abajo, organizada como si fueran sprints. |

---

## 7. Endpoints de la API

Todas las respuestas siguen el mismo formato estandarizado:

```json
// Éxito
{ "success": true, "data": { /* ... */ } }

// Error
{ "success": false, "error": "mensaje", "details": [ /* opcional */ ] }
```

### Autenticación (`/api/auth`)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | Público | Registra un usuario nuevo (siempre rol `cliente`). |
| POST | `/api/auth/login` | Público | Verifica credenciales y devuelve un JWT. |
| GET | `/api/auth/perfil` | Autenticado | Devuelve los datos del usuario logueado. |

### Usuarios (`/api/usuarios`)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/usuarios/profesionales` | Autenticado | Lista los profesionales disponibles (rol admin), filtrable por `?especialidad=`. |
| POST | `/api/usuarios` | Solo admin | Crea un usuario con un rol específico (admin o cliente). |
| GET | `/api/usuarios` | Solo admin | Lista todos los usuarios, filtrable por `?rol=`. |

### Turnos (`/api/turnos`)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/turnos` | Cliente autenticado | Crea un turno para el usuario autenticado. |
| GET | `/api/turnos/mis-turnos` | Cliente autenticado | Historial de turnos propios. |
| GET | `/api/turnos` | Solo admin | Lista todos los turnos. Filtros: `?especialidad=`, `?profesional=`, `?estado=`. |
| GET | `/api/turnos/:id` | Admin o el propio paciente | Detalle de un turno. |
| PUT | `/api/turnos/:id/estado` | Solo admin | Cambia el estado (`pendiente`, `confirmado`, `cancelado`, `completado`). |
| DELETE | `/api/turnos/:id` | El propio paciente | Cancela su propio turno (cambia el estado a `cancelado`). |

### Ejemplo de uso con `curl`

```bash
# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan Pérez","email":"juan@test.com","password":"Password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@test.com","password":"Password123"}'

# Crear un turno (reemplazar TOKEN y ID_PROFESIONAL)
curl -X POST http://localhost:3000/api/turnos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"profesional":"ID_PROFESIONAL","especialidad":"Cardiología","fecha":"2026-08-01","hora":"10:00"}'
```

---

## 8. Testing

```bash
npm test
```

### Tests unitarios (`tests/unit/`)
- `passwordUtils.test.js`: verifica determinismo del hash, que el salt cambie en cada llamada, y que `verificarPassword` distinga contraseñas correctas de incorrectas.
- `jwtService.test.js`: verifica generación y verificación de JWT, y que un token alterado sea rechazado.

### Tests de integración (`tests/integration/`)
- `auth.test.js`: registro (casos válidos e inválidos, email duplicado, intento de auto-asignarse rol admin), login (credenciales correctas/incorrectas), ruta privada de perfil.
- `turnos.test.js`: creación de turnos, control de agenda (no permite doble booking, libera el horario al cancelar), control de acceso por rol (un cliente no puede listar todos los turnos ni cambiar estados), un paciente no puede cancelar el turno de otro paciente.

Los tests de integración usan `mongodb-memory-server`, así que se pueden correr sin tener MongoDB instalado.

---

## 9. Hitos de desarrollo (organizados como sprints)

Siguiendo los hitos sugeridos en la consigna del proyecto:

1. ✅ **Definición de la estructura, modelo de datos y endpoints** — Diseño de los modelos `Usuario` y `Turno`, y de los endpoints REST.
2. ✅ **Implementación básica de CRUD** — Endpoints de turnos (crear, listar, cambiar estado, cancelar).
3. ✅ **Gestión de usuarios con roles y JWT** — Registro, login, JWT, roles admin/cliente.
4. ✅ **Middleware de validación, autenticación, autorización** — `authMiddleware`, `roleMiddleware`, `express-validator`, `responseHandler`, `errorHandler`.
5. ✅ **Pruebas unitarias e integración** — Jest + Supertest, `mongodb-memory-server`.
6. ⬜ **Despliegue y demostración** — Pendiente de que cada estudiante despliegue su propia instancia (Render, Railway, etc.) y grabe la demo en video.

---

## 10. Posibles mejoras futuras

- Agregar un tercer rol `profesional`, distinto de `admin`, con permisos más acotados.
- Migrar `fecha`/`hora` a un tipo `Date` con manejo explícito de zona horaria si la aplicación necesitara soportar distintas regiones.
- Agregar paginación a los listados (`GET /api/turnos`, `GET /api/usuarios`) para grandes volúmenes de datos.
- Agregar recuperación de contraseña (reset por email).
- Servir el front-end desde un framework como React, en vez de HTML/JS plano (quedó fuera del alcance de esta materia).
