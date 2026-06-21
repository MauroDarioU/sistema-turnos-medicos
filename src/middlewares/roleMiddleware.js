// src/middlewares/roleMiddleware.js
//
// Middleware de AUTORIZACIÓN (distinto de autenticación). Recordemos la
// diferencia que marca la clase 8:
//   - Autenticación: ¿quién es el usuario? (lo resuelve authMiddleware)
//   - Autorización:  ¿qué puede hacer ese usuario? (lo resuelve este archivo)
//
// Este middleware es una "fábrica de middlewares": es una función que
// recibe los roles permitidos y DEVUELVE el middleware real. Esto nos
// permite escribir en las rutas algo muy legible, por ejemplo:
//
//   router.delete('/:id', authMiddleware, soloRoles('admin'), turnoController.eliminar);
//
// Importante: roleMiddleware siempre debe usarse DESPUÉS de authMiddleware,
// ya que depende de que req.user ya haya sido completado por éste.

function soloRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      // Esto no debería pasar si las rutas están bien configuradas, pero
      // lo dejamos como salvaguarda defensiva.
      return res.error('No autenticado.', 401);
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.error(
        `Acceso denegado. Se requiere el rol: ${rolesPermitidos.join(' o ')}`,
        403
      );
    }

    next();
  };
}

module.exports = soloRoles;
