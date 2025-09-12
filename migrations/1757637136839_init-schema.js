// CommonJS
exports.up = (pgm) => {
  // users
  pgm.createTable('users', {
    id: 'id', // SERIAL PRIMARY KEY (int)
    name: { type: 'varchar(100)', notNull: true },
    email: { type: 'varchar(150)', notNull: true, unique: true },
    profile_image: 'varchar(500)',
    bio: 'text',
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', default: pgm.func('now()') }
  });

  // movies
  pgm.createTable('movies', {
    id: 'id',
    title: { type: 'varchar(200)', notNull: true },
    year: 'int',
    genre: 'varchar(100)',
    director: 'varchar(100)',
    poster_url: 'varchar(500)',
    description: 'text',
    created_at: { type: 'timestamptz', default: pgm.func('now()') }
  });

  // reviews (FK a users/movies, rating int 1..5)
  pgm.createTable('reviews', {
    id: 'id',
    movie_id: { type: 'int', notNull: true, references: 'movies', onDelete: 'CASCADE' },
    user_id:  { type: 'int', notNull: true, references: 'users',  onDelete: 'CASCADE' },
    title: { type: 'varchar(200)', notNull: true },
    body:  { type: 'text', notNull: true },
    rating:{ type: 'int', notNull: true },        // validamos con CHECK abajo
    has_spoilers: { type: 'boolean', default: false },
    tags: 'text[]',
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', default: pgm.func('now()') }
  });
  pgm.addConstraint('reviews', 'reviews_rating_1_5_chk', { check: 'rating BETWEEN 1 AND 5' });

  // likes (único por (review_id, user_id))
  pgm.createTable('review_likes', {
    id: 'id',
    review_id: { type: 'int', notNull: true, references: 'reviews', onDelete: 'CASCADE' },
    user_id:   { type: 'int', notNull: true, references: 'users',  onDelete: 'CASCADE' },
    created_at:{ type: 'timestamptz', default: pgm.func('now()') }
  });
  pgm.addConstraint('review_likes', 'ux_review_likes_review_user', { unique: ['review_id', 'user_id'] });

  // comments
  pgm.createTable('review_comments', {
    id: 'id',
    review_id: { type: 'int', notNull: true, references: 'reviews', onDelete: 'CASCADE' },
    user_id:   { type: 'int', notNull: true, references: 'users',  onDelete: 'CASCADE' },
    comment:   { type: 'text', notNull: true },
    created_at:{ type: 'timestamptz', default: pgm.func('now()') }
  });
};

exports.down = (pgm) => {
  ['review_comments','review_likes','reviews','movies','users']
    .forEach(t => pgm.dropTable(t, { ifExists: true, cascade: true }));
};
