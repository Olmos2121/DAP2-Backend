/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  // 1) Agregar nueva PK entera en reviews
  pgm.addColumn('reviews', { id: { type: 'bigserial' } });
  // backfill seguro (usa DEFAULT → nextval)
  pgm.sql(`UPDATE reviews SET id = DEFAULT WHERE id IS NULL;`);
  pgm.alterColumn('reviews', 'id', { notNull: true });

  // 2) Preparar review_version para el cambio (nueva col int + backfill)
  pgm.addColumn('review_version', { review_id_int: { type: 'bigint' } });
  pgm.sql(`
    UPDATE review_version v
    SET review_id_int = r.id
    FROM reviews r
    WHERE v.review_id = r.review_id
  `);
  pgm.alterColumn('review_version', 'review_id_int', { notNull: true });

  // 3) soltar la FK vieja que apunta a reviews(review_id)
  pgm.dropConstraint('review_version', 'review_version_fk_review_id', { ifExists: true });

  // 4) cambiar la PK de reviews a 'id'
  pgm.dropConstraint('reviews', 'reviews_pkey'); // ahora ya no hay dependencias
  pgm.addConstraint('reviews', 'reviews_pkey', { primaryKey: 'id' });

  // opcional: mantener review_id único como compat
  pgm.createIndex('reviews', 'review_id', { unique: true, name: 'ux_reviews_review_id', ifNotExists: true });

  // 5) crear la nueva FK desde review_version al nuevo PK
  pgm.addConstraint('review_version', 'fk_review_version_review_id_int', {
    foreignKeys: { columns: 'review_id_int', references: 'reviews(id)', onDelete: 'CASCADE' },
  });

  // 6) reemplazar la PK compuesta en review_version y limpiar columnas
  pgm.dropConstraint('review_version', 'review_version_pkey');
  pgm.addConstraint('review_version', 'review_version_pkey', { primaryKey: ['review_id_int', 'version_number'] });

  pgm.dropColumn('review_version', 'review_id'); // vieja (uuid)
  pgm.renameColumn('review_version', 'review_id_int', 'review_id'); // nueva (int)
};

exports.down = (pgm) => {
  // (si necesitás down, te lo armo; lo omitimos para simplificar)
};
