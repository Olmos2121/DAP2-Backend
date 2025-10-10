<<<<<<< HEAD
jest.mock('../db.js', () => ({
    query: jest.fn(),
}));

const pool = require('../db');
const {
    getUser,
    getAllUsers,
} = require('../models/usersModel.js');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('usersModel', () => {
    //getUser
    describe('getUser', () => {
        // Camino feliz - usuario existe y se devuelve
        it('Debe devolver los datos del usuario cuando existe', async () => {
            const mockUser = { id: 1, name: 'jose perez', email: 'jose@example.com' };
            pool.query.mockResolvedValueOnce({ rows: [mockUser] });

            const user = await getUser(1);
            expect(user).toEqual(mockUser);
        });

        // Camino triste - usuario no existe
        it('Debe devolver null cuando el usuario no existe', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const user = await getUser(-1);
            expect(user).toBeUndefined();
        });

        // Camino triste - error en la base de datos
        it('Debe manejar errores de la base de datos y devolver null', async () => {
            pool.query.mockRejectedValueOnce(new Error('DB error'));

            const user = await getUser(1);
            expect(user).toBeNull();
        });
    });

    //getAllUsers
    describe('getAllUsers', () => {
        // Camino feliz - existen usuarios y se devuelven
        it('Debe devolver todos los usuarios', async () => {
            const mockUsers = [
                { id: 1, name: 'jose perez', email: 'jose@example.com' },
                { id: 2, name: 'marcos lopez', email: 'marcos@example.com' },
            ];
            pool.query.mockResolvedValueOnce({ rows: mockUsers });

            const users = await getAllUsers();
            expect(users).toEqual(mockUsers);
        });

        // Camino triste - no existen usuarios
        it('Debe devolver un array vacío cuando no existen usuarios', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const users = await getAllUsers();
            expect(users).toEqual([]);
        });

        // Camino triste - error en la base de datos
        it('Debe manejar errores de la base de datos y devolver un array vacío', async () => {
            pool.query.mockRejectedValueOnce(new Error('DB error'));
            const users = await getAllUsers();

            expect(users).toEqual([]);
        });
    });
});
=======
// tests/usersModel.test.js
import { afterAll, beforeEach, expect, jest } from '@jest/globals';

// Mock del export default de ../db.js (pool)
jest.unstable_mockModule('../db.js', () => ({
  default: {
    query: jest.fn(),
  },
}));

// Importar DESPUÉS del mock
const { default: pool } = await import('../db.js');
const usersModule = await import('../models/usersModel.js');

// Soportar named o default exports
const getUser    = usersModule.getUser    ?? usersModule.default?.getUser;
const getAllUsers= usersModule.getAllUsers?? usersModule.default?.getAllUsers;

if (![getUser, getAllUsers].every(Boolean)) {
  throw new Error('No se pudieron importar getUser/getAllUsers desde models/usersModel.js (revisá exports).');
}

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('usersModel', () => {
  describe('getUser', () => {
    it('Debe devolver los datos del usuario cuando existe', async () => {
      const mockUser = { id: 1, name: 'jose perez', email: 'jose@example.com' };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const user = await getUser(1);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users_cache WHERE user_id = $1',
        [1]
      );
      expect(user).toEqual(mockUser);
    });

    it('Debe devolver null cuando el usuario no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const user = await getUser(-1);
      expect(user).toBeNull();
    });

    it('Debe manejar errores de la base de datos y devolver null', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error'));

      const user = await getUser(1);
      expect(user).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    it('Debe devolver todos los usuarios', async () => {
      const mockUsers = [
        { id: 1, name: 'jose perez', email: 'jose@example.com' },
        { id: 2, name: 'marcos lopez', email: 'marcos@example.com' },
      ];
      pool.query.mockResolvedValueOnce({ rows: mockUsers });

      const users = await getAllUsers();
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users_cache ORDER BY updated_at DESC'
      );
      expect(users).toEqual(mockUsers);
    });

    it('Debe devolver un array vacío cuando no existen usuarios', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const users = await getAllUsers();
      expect(users).toEqual([]);
    });

    it('Debe manejar errores de la base de datos y devolver un array vacío', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error'));

      const users = await getAllUsers();
      expect(users).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
>>>>>>> develop
