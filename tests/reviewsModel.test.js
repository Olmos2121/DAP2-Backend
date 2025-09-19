jest.mock('../db.js', () => ({
  query: jest.fn(),
}));

const pool = require('../db');
const {
  createReview,
  getReview,
  updateReview,
  deleteReview,
  filterReviews,
//   getLikes,
//   addLike,
//   removeLike,
//   getComments,
//   addComment,
//   deleteComment,
} = require('../models/reviewsModel');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('reviewsModel', () => {
  // createReview
  describe('createReview', () => {
    // camino feliz - no hay errores de película/usuario no existen
    it('inserta y devuelve la reseña cuando película y usuario existen', async () => {
      // mockeamos las respuestas de la base de datos
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // SELECT movies (la película existe)
        .mockResolvedValueOnce({ rows: [{ id: 20 }] }) // SELECT users (el usuario existe)
        .mockResolvedValueOnce({ rows: [{
          id: 1, movie_id: 10, user_id: 20, rating: 5, has_spoilers: false,
          body: 'texto', title: 'titulo', tags: ['tag'], created_at: '2025-09-16', updated_at: '2025-09-16'
        }] }); // INSERT reviews RETURNING ... (la reseña insertada)

        // llamamos a la función bajo prueba
      const data = await createReview({
        movie_id: 10,
        user_id: 20,
        rating: 5,
        has_spoilers: false,
        body: 'texto',
        title: 'titulo',
        tags: ['tag'],
      });

      // verificamos que las queries se llamaron con los parámetros correctos
      expect(pool.query).toHaveBeenNthCalledWith(
        1,
        'SELECT id FROM movies WHERE id = $1',
        [10]
      );
      expect(pool.query).toHaveBeenNthCalledWith(
        2,
        'SELECT id FROM users WHERE id = $1',
        [20]
      );
      // 3ra llamada es el INSERT; no comparamos SQL completo, pero sí parámetros
      const thirdCall = pool.query.mock.calls[2];
      expect(thirdCall[0]).toMatch(/INSERT INTO reviews/i);
      expect(thirdCall[1]).toEqual([10, 20, 5, false, 'texto', 'titulo', ['tag']]);

      expect(data).toMatchObject({
        id: 1,
        movie_id: 10,
        user_id: 20,
        rating: 5,
        has_spoilers: false,
      });
    });

    // camino triste - película no existe
    it('lanza error si la película no existe', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // movie not found

      await expect(createReview({
        movie_id: 999, user_id: 20, rating: 3, has_spoilers: false, body: '', title: '', tags: []
      })).rejects.toThrow('La película especificada no existe');

      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    // camino triste - usuario no existe
    it('lanza error si el usuario no existe', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // movie ok
        .mockResolvedValueOnce({ rows: [] });          // user not found

      await expect(createReview({
        movie_id: 10, user_id: 999, rating: 3, has_spoilers: false, body: '', title: '', tags: []
      })).rejects.toThrow('El usuario especificado no existe');

      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });

  // getReview
  describe('getReview', () => {
    // camino feliz - la reseña existe
    it('devuelve la reseña enriquecida si existe', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1, user_id: 2, movie_id: 3, user_name: 'Ada', movie_title: 'Matrix',
        }]
      });

      const r = await getReview(1);
      expect(pool.query).toHaveBeenCalledWith(expect.stringMatching(/FROM reviews r/i), [1]);
      expect(r).toMatchObject({ id: 1, user_name: 'Ada', movie_title: 'Matrix' });
    });

    // camino triste - la reseña no existe
    it('devuelve null si no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await expect(getReview(999)).resolves.toBeNull();
    });

    // camino triste - error en la query
    it('devuelve null si ocurre un error (catch interno)', async () => {
      pool.query.mockRejectedValueOnce(new Error('boom'));
      await expect(getReview(1)).resolves.toBeNull();
    });
  });

  // updateReview
  describe('updateReview', () => {
    // camino feliz - la reseña existe
    it('actualiza y retorna la fila cuando existe', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1, movie_id: 9, user_id: 8, rating: 4, has_spoilers: true,
          body: 'b', title: 't', tags: ['x'], created_at: '2025-09-16', updated_at: '2025-09-17'
        }]
      });

      const out = await updateReview(1, { rating: 4, has_spoilers: true });
      const [sql, params] = pool.query.mock.calls[0];

      expect(sql).toMatch(/UPDATE reviews/i);
      expect(params[0]).toBe(1); // id
      // posiciones de params restantes: [id, movie_id, user_id, rating, has_spoilers, body, title, tags]
      expect(params[4]).toBe(true);
      expect(out).toMatchObject({ id: 1, rating: 4, has_spoilers: true });
    });

    // camino triste - la reseña no existe
    it('retorna null cuando no encuentra la fila', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await expect(updateReview(999, { title: 'n' })).resolves.toBeNull();
    });

    // camino triste - error en la query
    it('propaga error si falla la query', async () => {
      pool.query.mockRejectedValueOnce(new Error('db down'));
      await expect(updateReview(1, { title: 'x' })).rejects.toThrow('db down');
    });
  });

  // deleteReview
  describe('deleteReview', () => {
    // camino feliz - la reseña existe
    it('retorna true cuando borra filas', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      await expect(deleteReview(1)).resolves.toBe(true);
    });

    // camino triste - la reseña no existe
    it('retorna false cuando no borra nada', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0 });
      await expect(deleteReview(999)).resolves.toBe(false);
    });

    // camino triste - error en la query
    it('retorna false si ocurre un error (catch interno)', async () => {
      pool.query.mockRejectedValueOnce(new Error('boom'));
      await expect(deleteReview(1)).resolves.toBe(false);
    });
  });

  // filterReviews
  describe('filterReviews', () => {
    beforeAll(() => {
      // Fijamos el tiempo para tests de date_range (evitamos fragilidad)
      jest.useFakeTimers().setSystemTime(new Date('2025-09-17T12:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    // camino feliz - varios filtros
    it('arma filtros básicos y pagina', async () => {
      // Devuelve dos filas + total_count en la primera
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1, movie_id: 10, user_id: 20, rating: 5, has_spoilers: false,
            total_count: '2', user_name: 'Ada', movie_title: 'Matrix'
          },
          {
            id: 2, movie_id: 10, user_id: 30, rating: 4, has_spoilers: false,
            total_count: '2', user_name: 'Bob', movie_title: 'Matrix'
          },
        ],
      });

      // llamamos a la función bajo prueba con varios filtros
      // y opciones de orden/limit/offset
      // (no importa si no tienen sentido juntos; solo probamos SQL)
      const { rows, total } = await filterReviews(
        { movie_id: 10, user_id: 20, min_rating: 4, max_rating: 5, has_spoilers: false, genre: 'sci' },
        { orderBy: 'r.created_at DESC', limit: 10, offset: 0 }
      );

      const [sql, params] = pool.query.mock.calls[0];

      expect(sql).toMatch(/FROM reviews r/i);
      expect(sql).toMatch(/JOIN users u/i);
      expect(sql).toMatch(/JOIN movies m/i);
      expect(sql).toMatch(/ORDER BY r\.created_at DESC/i);
      // Verificamos que se apliquen todos los filtros en el orden esperado
      // movie_id, user_id, min_rating, max_rating, has_spoilers, genre, limit, offset
      expect(params).toEqual([10, 20, 4, 5, false, '%sci%', 10, 0]);

      expect(total).toBe(2);
      expect(rows.every(r => r.total_count === undefined)).toBe(true); // se elimina total_count
    });

    // camino feliz - filtro tags (OR de @>)
    it('filtra por tags como OR de @>', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await filterReviews({ tags: ['drama', 'thriller'] }, {});
      const [sql, params] = pool.query.mock.calls[0];

      expect(sql).toMatch(/r\.tags @> \$\d+.*OR.*r\.tags @> \$\d+/i);
      // params deben ser JSON strings de arrays: ["drama"], ["thriller"]
      expect(params).toContain(JSON.stringify(['drama']));
      expect(params).toContain(JSON.stringify(['thriller']));
    });

    // camino feliz - filtro date_range
    it('agrega condición de fecha con "este-mes"', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await filterReviews({ date_range: 'este-mes' }, {});
      const [sql, params] = pool.query.mock.calls[0];

      expect(sql).toMatch(/r\.created_at >= \$\d+/i);
      // No validamos el string exacto por TZ; solo que sea ISO string
      const dateParam = params.find(p => typeof p === 'string' && /\d{4}-\d{2}-\d{2}T/.test(p));
      expect(dateParam).toBeTruthy();
    });

    // camino triste - error en la query
    it('propaga errores (catch lanza)', async () => {
      pool.query.mockRejectedValueOnce(new Error('fail'));
      await expect(filterReviews({}, {})).rejects.toThrow('fail');
    });

    // camino feliz - sin filtros (todos undefined)
    it('funciona sin filtros (todos undefined)', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await filterReviews({}, {});
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toMatch(/WHERE 1=1/i);
      expect(params).toEqual([]);
    });

    // camino triste - no hay filas
    it('devuelve [] y total 0 si no hay filas', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const out = await filterReviews({ movie_id: 1 }, {});
      expect(out).toEqual({ rows: [], total: 0 });
    });

    // camino triste - limit/offset no son números
    it('funciona si limit/offset no son números (no aplica paginación)', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await filterReviews({}, { limit: 'x', offset: null });
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).not.toMatch(/LIMIT/i);
      expect(sql).not.toMatch(/OFFSET/i);
      expect(params).toEqual([]);
    });

    // camino triste - fecha inválida en date_range
    it('ignora date_range si es inválido', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await filterReviews({ date_range: 'invalid-date' }, {});
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).not.toMatch(/r\.created_at >=/i);
      expect(params).toEqual([]);
    });
  });


  // Likes
//   describe('likes', () => {
//     it('getLikes devuelve filas', async () => {
//       pool.query.mockResolvedValueOnce({
//         rows: [{ id: 1, name: 'Ada', profile_image: null }],
//       });
//       const out = await getLikes(10);
//       expect(pool.query).toHaveBeenCalledWith(expect.stringMatching(/FROM review_likes rl/i), [10]);
//       expect(out).toHaveLength(1);
//     });

//     it('getLikes devuelve [] si falla', async () => {
//       pool.query.mockRejectedValueOnce(new Error('x'));
//       await expect(getLikes(10)).resolves.toEqual([]);
//     });

//     it('addLike devuelve la fila insertada', async () => {
//       pool.query.mockResolvedValueOnce({ rows: [{ id: 1, review_id: 9, user_id: 3 }] });
//       const out = await addLike(9, 3);
//       expect(pool.query).toHaveBeenCalledWith(expect.stringMatching(/INSERT INTO review_likes/i), [9, 3]);
//       expect(out).toMatchObject({ review_id: 9, user_id: 3 });
//     });

//     it('addLike devuelve el mensaje si no inserta (ON CONFLICT DO NOTHING)', async () => {
//       pool.query.mockResolvedValueOnce({ rows: [] });
//       const out = await addLike(9, 3);
//       expect(out).toEqual({ message: 'Ya diste like a esta reseña' });
//     });

//     it('addLike propaga error si falla', async () => {
//       pool.query.mockRejectedValueOnce(new Error('db'));
//       await expect(addLike(1, 2)).rejects.toThrow('db');
//     });

//     it('removeLike retorna true cuando borra', async () => {
//       pool.query.mockResolvedValueOnce({ rowCount: 1 });
//       await expect(removeLike(9, 3)).resolves.toBe(true);
//     });

//     it('removeLike retorna false cuando no borra', async () => {
//       pool.query.mockResolvedValueOnce({ rowCount: 0 });
//       await expect(removeLike(9, 3)).resolves.toBe(false);
//     });

//     it('removeLike retorna false si falla', async () => {
//       pool.query.mockRejectedValueOnce(new Error('x'));
//       await expect(removeLike(9, 3)).resolves.toBe(false);
//     });
//   });

  // Comments
//   describe('comments', () => {
//     it('getComments devuelve filas', async () => {
//       pool.query.mockResolvedValueOnce({
//         rows: [{ id: 1, user_id: 2, comment: 'hola', user_name: 'Ada' }],
//       });
//       const out = await getComments(7);
//       expect(pool.query).toHaveBeenCalledWith(expect.stringMatching(/FROM review_comments rc/i), [7]);
//       expect(out).toHaveLength(1);
//     });

//     it('getComments devuelve [] si falla', async () => {
//       pool.query.mockRejectedValueOnce(new Error('boom'));
//       await expect(getComments(7)).resolves.toEqual([]);
//     });

//     it('addComment devuelve la fila insertada', async () => {
//       pool.query.mockResolvedValueOnce({ rows: [{ id: 1, review_id: 7, user_id: 2, comment: 'hola' }] });
//       const out = await addComment(7, 2, 'hola');
//       expect(pool.query).toHaveBeenCalledWith(expect.stringMatching(/INSERT INTO review_comments/i), [7, 2, 'hola']);
//       expect(out).toMatchObject({ id: 1, review_id: 7, user_id: 2, comment: 'hola' });
//     });

//     it('addComment propaga error si falla', async () => {
//       pool.query.mockRejectedValueOnce(new Error('db'));
//       await expect(addComment(7, 2, 'hola')).rejects.toThrow('db');
//     });

//     it('deleteComment retorna true cuando borra', async () => {
//       pool.query.mockResolvedValueOnce({ rowCount: 1 });
//       await expect(deleteComment(5, 2)).resolves.toBe(true);
//     });

//     it('deleteComment retorna false cuando no borra', async () => {
//       pool.query.mockResolvedValueOnce({ rowCount: 0 });
//       await expect(deleteComment(5, 2)).resolves.toBe(false);
//     });

//     it('deleteComment retorna false si falla', async () => {
//       pool.query.mockRejectedValueOnce(new Error('x'));
//       await expect(deleteComment(5, 2)).resolves.toBe(false);
//     });
//   });
});
