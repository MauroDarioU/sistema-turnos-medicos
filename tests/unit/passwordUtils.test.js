// tests/unit/passwordUtils.test.js
//
// Tests UNITARIOS, tal como vimos en la clase 10: probamos una función
// aislada, sin levantar el servidor ni conectarnos a una base de datos.
// Cada test verifica UN solo comportamiento (buena práctica explicada en
// la clase: "si testeamos demasiadas cosas en un solo test, será difícil
// entender qué salió mal si falla").

const {
  crearCredenciales,
  verificarPassword,
  hashPassword,
} = require('../../src/utils/passwordUtils');

describe('passwordUtils', () => {
  describe('crearCredenciales()', () => {
    test('genera un salt y un hash no vacíos', () => {
      const { salt, hash } = crearCredenciales('MiPassword123');

      expect(salt).toBeTruthy();
      expect(hash).toBeTruthy();
      expect(typeof salt).toBe('string');
      expect(typeof hash).toBe('string');
    });

    test('genera salts distintos para dos llamadas distintas (no determinismo del salt)', () => {
      const cred1 = crearCredenciales('MiPassword123');
      const cred2 = crearCredenciales('MiPassword123');

      expect(cred1.salt).not.toBe(cred2.salt);
    });

    test('dos usuarios con la misma password generan hashes distintos (gracias al salt)', () => {
      const cred1 = crearCredenciales('MiPassword123');
      const cred2 = crearCredenciales('MiPassword123');

      expect(cred1.hash).not.toBe(cred2.hash);
    });
  });

  describe('hashPassword()', () => {
    test('es determinista: la misma password y el mismo salt producen siempre el mismo hash', () => {
      const salt = 'un-salt-fijo-para-este-test';
      const hash1 = hashPassword('MiPassword123', salt);
      const hash2 = hashPassword('MiPassword123', salt);

      expect(hash1).toBe(hash2);
    });

    test('un cambio mínimo en la password produce un hash completamente distinto (efecto avalancha)', () => {
      const salt = 'otro-salt-fijo';
      const hash1 = hashPassword('MiPassword123', salt);
      const hash2 = hashPassword('MiPassword124', salt); // un solo carácter distinto

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verificarPassword()', () => {
    test('devuelve true cuando la password ingresada es la correcta', () => {
      const { salt, hash } = crearCredenciales('ClaveSegura123');

      expect(verificarPassword('ClaveSegura123', salt, hash)).toBe(true);
    });

    test('devuelve false cuando la password ingresada es incorrecta', () => {
      const { salt, hash } = crearCredenciales('ClaveSegura123');

      expect(verificarPassword('OtraClave999', salt, hash)).toBe(false);
    });

    test('devuelve false si se usa un salt distinto al que generó el hash', () => {
      const { hash } = crearCredenciales('ClaveSegura123');
      const saltIncorrecto = 'salt-que-no-corresponde';

      expect(verificarPassword('ClaveSegura123', saltIncorrecto, hash)).toBe(false);
    });
  });
});
