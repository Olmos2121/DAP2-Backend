// 0002_create_reviews_core.js  (CommonJS)
exports.up = (pgm) => {
  pgm.createTable('reviews', {
    review_id:   { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id:     { type: 'text', notNull: true },
    movie_id:    { type: 'text', notNull: true },
    rating:      { type: 'numeric(3,1)', notNull: true },
    has_spoilers:{ type: 'boolean', notNull: true, default: false },
    body:        { type: 'text', notNull: true },
    status:      { type: 'text', notNull: true, default: 'pending' },
    edit_count:  { type: 'int', notNull: true, default: 0 },
    created_at:  { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at:  { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    source:      { type: 'text' }
  });
  pgm.addConstraint('reviews', 'reviews_rating_range_chk', { check: 'rating >= 0 AND rating <= 10' });
  pgm.createIndex('reviews', ['movie_id']);
  pgm.createIndex('reviews', ['user_id']);
  pgm.createIndex('reviews', [{ name: 'created_at', sort: 'DESC' }]);

  // ⬇️ composite PK CORRECTO (no lo pongas como columna)
  pgm.createTable('review_version', {
    review_id:      { type: 'uuid', notNull: true },
    version_number: { type: 'int', notNull: true },
    body:           { type: 'text', notNull: true },
    rating:         { type: 'numeric(3,1)', notNull: true },
    edited_at:      { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    edited_by:      { type: 'text' },
  }, {
    constraints: {
      primaryKey: ['review_id', 'version_number'],
      // opcional: FK interna (misma base)
      foreignKeys: {
        columns: 'review_id',
        references: 'reviews(review_id)',
        onDelete: 'CASCADE',
      }
    }
  });

  pgm.createTable('movie_rating_agg', {
    movie_id:        { type: 'text', primaryKey: true },
    rating_count:    { type: 'int', notNull: true, default: 0 },
    sum_rating:      { type: 'numeric(10,1)', notNull: true, default: 0 },
    recalculated_at: { type: 'timestamptz', default: pgm.func('now()') }
  });

  pgm.createTable('outbox_event', {
    event_id:       { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    aggregate_type: { type: 'text', notNull: true },
    aggregate_id:   { type: 'text', notNull: true },
    type:           { type: 'text', notNull: true },
    payload:        { type: 'jsonb', notNull: true },
    status:         { type: 'text', notNull: true, default: 'PENDING' },
    retry_count:    { type: 'int', notNull: true, default: 0 },
    created_at:     { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    sent_at:        { type: 'timestamptz' }
  });
  pgm.createIndex('outbox_event', ['status', { name: 'created_at', sort: 'ASC' }]);

  pgm.createTable('inbox_event', {
    event_id:    { type: 'text', primaryKey: true },
    source:      { type: 'text' },
    received_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  pgm.createTable('users_cache', {
    user_id:        { type: 'text', primaryKey: true },
    handle:         'text',
    display_name:   'text',
    avatar_url:     'text',
    updated_at:     { type: 'timestamptz' },
    source_version: 'text',
    last_event_id:  'text'
  });

  pgm.createTable('movies_cache', {
    movie_id:       { type: 'text', primaryKey: true },
    title:          'text',
    year:           'int',
    synopsis:       'text',
    duration:       'text',
    updated_at:     { type: 'timestamptz' },
    source_version: 'text',
    last_event_id:  'text'
  });
};

exports.down = (pgm) => {
  ['movies_cache','users_cache','inbox_event','outbox_event',
   'movie_rating_agg','review_version','reviews'].forEach(t => pgm.dropTable(t));
};
