// tests/moviesModel.test.js
import { jest } from '@jest/globals';

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  console.error.mockRestore();
});

// Mock del export default de ../db.js (pool)
jest.unstable_mockModule('../db.js', () => ({
  default: {
    query: jest.fn(),
  },
}));

// Importar DESPUÉS del mock
const { default: pool } = await import('../db.js');
const moviesModule = await import('../models/moviesModel.js');

// Soporta named o default export
const getMovie            = moviesModule.getMovie            ?? moviesModule.default?.getMovie;
const getAllMovies        = moviesModule.getAllMovies        ?? moviesModule.default?.getAllMovies;
const searchMovies        = moviesModule.searchMovies        ?? moviesModule.default?.searchMovies;
const getMoviesByGenre    = moviesModule.getMoviesByGenre    ?? moviesModule.default?.getMoviesByGenre;

if (![getMovie, getAllMovies, searchMovies, getMoviesByGenre].every(Boolean)) {
  throw new Error('No se pudieron importar las funciones del moviesModel (revisá los exports).');
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('moviesModel', () => {
  describe('getMovie', () => {
    it('devuelve la película cuando existe', async () => {
      const row = { id: 7, title: 'Matrix', year: 1999 };
      pool.query.mockResolvedValueOnce({ rows: [row] });

      const out = await getMovie(7);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM movies WHERE id = $1', [7]);
      expect(out).toEqual(row);
    });

    it('devuelve undefined cuando no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const out = await getMovie(999);
      expect(out).toBeUndefined();
    });

    it('devuelve null en caso de error', async () => {
      pool.query.mockRejectedValueOnce(new Error('db error'));

      const out = await getMovie(1);
      expect(out).toBeNull();
    });
  });

  describe('getAllMovies', () => {
    it('devuelve todas las películas ordenadas por created_at DESC', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      pool.query.mockResolvedValueOnce({ rows });

      const out = await getAllMovies();
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM movies ORDER BY created_at DESC');
      expect(out).toEqual(rows);
    });

    it('devuelve [] en caso de error', async () => {
      pool.query.mockRejectedValueOnce(new Error('db error'));

      const out = await getAllMovies();
      expect(out).toEqual([]);
    });
  });

  describe('searchMovies', () => {
    it('busca por título/director/género con ILIKE y ordena por created_at DESC', async () => {
      const rows = [{ id: 3, title: 'Inception' }];
      pool.query.mockResolvedValueOnce({ rows });

      const term = 'incep';
      const out = await searchMovies(term);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toMatch(/SELECT \* FROM movies\s+WHERE title ILIKE \$1 OR director ILIKE \$1 OR genre ILIKE \$1/i);
      expect(sql).toMatch(/ORDER BY created_at DESC/i);
      expect(params).toEqual([`%${term}%`]);

      expect(out).toEqual(rows);
    });

    it('devuelve [] en caso de error', async () => {
      pool.query.mockRejectedValueOnce(new Error('db error'));

      const out = await searchMovies('x');
      expect(out).toEqual([]);
    });
  });

  describe('getMoviesByGenre', () => {
    it('filtra por género con ILIKE y ordena por year DESC', async () => {
      const rows = [{ id: 4, genre: 'Sci-Fi', year: 2020 }];
      pool.query.mockResolvedValueOnce({ rows });

      const out = await getMoviesByGenre('sci');
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toMatch(/SELECT \* FROM movies WHERE genre ILIKE \$1 ORDER BY year DESC/i);
      expect(params).toEqual(['%sci%']);
      expect(out).toEqual(rows);
    });

    it('devuelve [] en caso de error', async () => {
      pool.query.mockRejectedValueOnce(new Error('db error'));

      const out = await getMoviesByGenre('drama');
      expect(out).toEqual([]);
    });
  });
});
