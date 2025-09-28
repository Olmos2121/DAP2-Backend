// tests/usersModel.test.js
import { jest } from '@jest/globals';

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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('usersModel', () => {
  describe('getUser', () => {
    it('Debe devolver los datos del usuario cuando existe', async () => {
      const mockUser = { id: 1, name: 'jose perez', email: 'jose@example.com' };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const user = await getUser(1);
      expect(user).toEqual(mockUser);
    });

    it('Debe devolver undefined cuando el usuario no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const user = await getUser(-1);
      expect(user).toBeUndefined();
    });

    it('Debe manejar errores de la base de datos y devolver null', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error'));

      const user = await getUser(1);
      expect(user).toBeNull();
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
    });
  });
});
