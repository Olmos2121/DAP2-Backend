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