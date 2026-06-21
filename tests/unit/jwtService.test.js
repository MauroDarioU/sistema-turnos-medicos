// tests/unit/jwtService.test.js
//
// Tests unitarios del servicio de JWT. Verificamos generación, verificación,
// y el caso de un token inválido/alterado (tal como se exploró "a mano" en
// la clase 8 cambiando un caracter del token).

const jwtService = require('../../src/services/jwtService');

describe('jwtService', () => {
  const payloadDePrueba = { id: '12345', email: 'test@issd.com', rol: 'cliente' };

  test('generateToken() devuelve un string no vacío', () => {
    const token = jwtService.generateToken(payloadDePrueba);

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
  });

  test('verifyToken() decodifica correctamente un token recién generado', () => {
    const token = jwtService.generateToken(payloadDePrueba);
    const decoded = jwtService.verifyToken(token);

    expect(decoded.id).toBe(payloadDePrueba.id);
    expect(decoded.email).toBe(payloadDePrueba.email);
    expect(decoded.rol).toBe(payloadDePrueba.rol);
  });

  test('verifyToken() lanza un error si el token fue alterado', () => {
    const token = jwtService.generateToken(payloadDePrueba);
    // Alteramos un solo carácter del token, como se sugiere probar en la
    // clase 8 ("Probá cambiando tan solo uno de los caracteres del token").
    const tokenAlterado = token.slice(0, -1) + (token.slice(-1) === 'a' ? 'b' : 'a');

    expect(() => jwtService.verifyToken(tokenAlterado)).toThrow();
  });

  test('verifyToken() lanza un error con un token vacío o mal formado', () => {
    expect(() => jwtService.verifyToken('esto-no-es-un-token-valido')).toThrow();
  });
});
