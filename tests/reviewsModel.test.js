// tests/reviewsModel.test.js
import { jest } from '@jest/globals';

// Mock del export default de ../db.js (pool)
jest.unstable_mockModule('../db.js', () => ({
  default: {
    query: jest.fn(),
  },
}));

// IMPORTAR luego del mock
const { default: pool } = await import('../db.js');
const reviewsModule = await import('../models/reviewsModel.js');

// Soportar named o default exports
const createReview = reviewsModule.createReview ?? reviewsModule.default?.createReview;
const getReview    = reviewsModule.getReview    ?? reviewsModule.default?.getReview;
const updateReview = reviewsModule.updateReview ?? reviewsModule.default?.updateReview;
const deleteReview = reviewsModule.deleteReview ?? reviewsModule.default?.deleteReview;
const filterReviews= reviewsModule.filterReviews?? reviewsModule.default?.filterReviews;

if (![createReview, getReview, updateReview, deleteReview, filterReviews].every(Boolean)) {
  throw new Error('No se pudieron importar las funciones desde models/reviewsModel.js (revisá exports).');
}

// Alias local para que coincida con tu código (_query)
const _query = pool.query;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('reviewsModel', () => {
  // createReview
  describe('createReview', () => {
    it('inserta y devuelve la reseña cuando película y usuario existen', async () => {
      _query
        .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // SELECT movies
        .mockResolvedValueOnce({ rows: [{ id: 20 }] }) // SELECT users
        .mockResolvedValueOnce({
          rows: [{
            id: 1, movie_id: 10, user_id: 20, rating: 5, has_spoilers: false,
            body: 'texto', title: 'titulo', tags: ['tag'], created_at: '2025-09-16', updated_at: '2025-09-16'
          }],
        }); // INSERT reviews RETURNING ...

      const data = await createReview({
        movie_id: 10,
        user_id: 20,
        rating: 5,
        has_spoilers: false,
        body: 'texto',
        title: 'titulo',
        tags: ['tag'],
      });

      expect(_query).toHaveBeenNthCalledWith(1, 'SELECT id FROM movies WHERE id = $1', [10]);
      expect(_query).toHaveBeenNthCalledWith(2, 'SELECT id FROM users WHERE id = $1', [20]);

      const thirdCall = _query.mock.calls[2];
      expect(thirdCall[0]).toMatch(/INSERT INTO reviews/i);
      expect(thirdCall[1]).toEqual([10, 20, 5, false, 'texto', 'titulo', ['tag']]);

      expect(data).toMatchObject({
        id: 1, movie_id: 10, user_id: 20, rating: 5, has_spoilers: false,
      });
    });

    it('lanza error si la película no existe', async () => {
      _query.mockResolvedValueOnce({ rows: [] }); // movie not found

      await expect(createReview({
        movie_id: 999, user_id: 20, rating: 3, has_spoilers: false, body: '', title: '', tags: []
      })).rejects.toThrow('La película especificada no existe');

      expect(_query).toHaveBeenCalledTimes(1);
    });

    it('lanza error si el usuario no existe', async () => {
      _query
        .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // movie ok
        .mockResolvedValueOnce({ rows: [] });          // user not found

      await expect(createReview({
        movie_id: 10, user_id: 999, rating: 3, has_spoilers: false, body: '', title: '', tags: []
      })).rejects.toThrow('El usuario especificado no existe');

      expect(_query).toHaveBeenCalledTimes(2);
    });
  });

  // getReview
  describe('getReview', () => {
    it('devuelve la reseña enriquecida si existe', async () => {
      _query.mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 2, movie_id: 3, user_name: 'Ada', movie_title: 'Matrix' }],
      });

      const r = await getReview(1);
      expect(_query).toHaveBeenCalledWith(expect.stringMatching(/FROM reviews r/i), [1]);
      expect(r).toMatchObject({ id: 1, user_name: 'Ada', movie_title: 'Matrix' });
    });

    it('devuelve null si no existe', async () => {
      _query.mockResolvedValueOnce({ rows: [] });
      await expect(getReview(999)).resolves.toBeNull();
    });

    it('devuelve null si ocurre un error (catch interno)', async () => {
      _query.mockRejectedValueOnce(new Error('boom'));
      await expect(getReview(1)).resolves.toBeNull();
    });
  });

  // updateReview
  describe('updateReview', () => {
    it('actualiza y retorna la fila cuando existe', async () => {
      _query.mockResolvedValueOnce({
        rows: [{
          id: 1, movie_id: 9, user_id: 8, rating: 4, has_spoilers: true,
          body: 'b', title: 't', tags: ['x'], created_at: '2025-09-16', updated_at: '2025-09-17'
        }],
      });

      const out = await updateReview(1, { rating: 4, has_spoilers: true });
      const [sql, params] = _query.mock.calls[0];

      expect(sql).toMatch(/UPDATE reviews/i);
      expect(params[0]).toBe(1);   // id
      expect(params[4]).toBe(true); // has_spoilers
      expect(out).toMatchObject({ id: 1, rating: 4, has_spoilers: true });
    });

    it('retorna null cuando no encuentra la fila', async () => {
      _query.mockResolvedValueOnce({ rows: [] });
      await expect(updateReview(999, { title: 'n' })).resolves.toBeNull();
    });

    it('propaga error si falla la query', async () => {
      _query.mockRejectedValueOnce(new Error('db down'));
      await expect(updateReview(1, { title: 'x' })).rejects.toThrow('db down');
    });
  });

  // deleteReview
  describe('deleteReview', () => {
    it('retorna true cuando borra filas', async () => {
      _query.mockResolvedValueOnce({ rowCount: 1 });
      await expect(deleteReview(1)).resolves.toBe(true);
    });

    it('retorna false cuando no borra nada', async () => {
      _query.mockResolvedValueOnce({ rowCount: 0 });
      await expect(deleteReview(999)).resolves.toBe(false);
    });

    it('retorna false si ocurre un error (catch interno)', async () => {
      _query.mockRejectedValueOnce(new Error('boom'));
      await expect(deleteReview(1)).resolves.toBe(false);
    });
  });

  // filterReviews
  describe('filterReviews', () => {
    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2025-09-17T12:00:00Z'));
    });
    afterAll(() => {
      jest.useRealTimers();
    });

    it('arma filtros básicos y pagina', async () => {
      _query.mockResolvedValueOnce({
        rows: [
          { id: 1, movie_id: 10, user_id: 20, rating: 5, has_spoilers: false, total_count: '2', user_name: 'Ada', movie_title: 'Matrix' },
          { id: 2, movie_id: 10, user_id: 30, rating: 4, has_spoilers: false, total_count: '2', user_name: 'Bob', movie_title: 'Matrix' },
        ],
      });

      const { rows, total } = await filterReviews(
        { movie_id: 10, user_id: 20, min_rating: 4, max_rating: 5, has_spoilers: false, genre: 'sci' },
        { orderBy: 'r.created_at DESC', limit: 10, offset: 0 }
      );

      const [sql, params] = _query.mock.calls[0];
      expect(sql).toMatch(/FROM reviews r/i);
      expect(sql).toMatch(/JOIN users u/i);
      expect(sql).toMatch(/JOIN movies m/i);
      expect(sql).toMatch(/ORDER BY r\.created_at DESC/i);
      expect(params).toEqual([10, 20, 4, 5, false, '%sci%', 10, 0]);

      expect(total).toBe(2);
      expect(rows.every(r => r.total_count === undefined)).toBe(true);
    });

    it('filtra por tags como OR de @>', async () => {
      _query.mockResolvedValueOnce({ rows: [] });

      await filterReviews({ tags: ['drama', 'thriller'] }, {});
      const [sql, params] = _query.mock.calls[0];

      expect(sql).toMatch(/r\.tags @> \$\d+.*OR.*r\.tags @> \$\d+/i);
      expect(params).toContain(JSON.stringify(['drama']));
      expect(params).toContain(JSON.stringify(['thriller']));
    });

    it('agrega condición de fecha con "este-mes"', async () => {
      _query.mockResolvedValueOnce({ rows: [] });

      await filterReviews({ date_range: 'este-mes' }, {});
      const [sql, params] = _query.mock.calls[0];

      expect(sql).toMatch(/r\.created_at >= \$\d+/i);
      const dateParam = params.find(p => typeof p === 'string' && /\d{4}-\d{2}-\d{2}T/.test(p));
      expect(dateParam).toBeTruthy();
    });

    it('propaga errores (catch lanza)', async () => {
      _query.mockRejectedValueOnce(new Error('fail'));
      await expect(filterReviews({}, {})).rejects.toThrow('fail');
    });

    it('funciona sin filtros (todos undefined)', async () => {
      _query.mockResolvedValueOnce({ rows: [] });
      await filterReviews({}, {});
      const [sql, params] = _query.mock.calls[0];
      expect(sql).toMatch(/WHERE 1=1/i);
      expect(params).toEqual([]);
    });

    it('devuelve [] y total 0 si no hay filas', async () => {
      _query.mockResolvedValueOnce({ rows: [] });
      const out = await filterReviews({ movie_id: 1 }, {});
      expect(out).toEqual({ rows: [], total: 0 });
    });

    it('funciona si limit/offset no son números (no aplica paginación)', async () => {
      _query.mockResolvedValueOnce({ rows: [] });
      await filterReviews({}, { limit: 'x', offset: null });
      const [sql, params] = _query.mock.calls[0];
      expect(sql).not.toMatch(/LIMIT/i);
      expect(sql).not.toMatch(/OFFSET/i);
      expect(params).toEqual([]);
    });

    it('ignora date_range si es inválido', async () => {
      _query.mockResolvedValueOnce({ rows: [] });
      await filterReviews({ date_range: 'invalid-date' }, {});
      const [sql, params] = _query.mock.calls[0];
      expect(sql).not.toMatch(/r\.created_at >=/i);
      expect(params).toEqual([]);
    });
  });
});
