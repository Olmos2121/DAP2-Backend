exports.up = (pgm) => {
  // índices
  pgm.createIndex('reviews','movie_id',{ name:'idx_reviews_movie_id' });
  pgm.createIndex('reviews','user_id',{ name:'idx_reviews_user_id' });
  pgm.createIndex('reviews','rating', { name:'idx_reviews_rating' });
  pgm.createIndex('reviews',[{name:'created_at',sort:'DESC'}],{ name:'idx_reviews_created_at' });
  pgm.createIndex('reviews','has_spoilers',{ name:'idx_reviews_has_spoilers' });
  pgm.createIndex('review_likes','review_id',{ name:'idx_review_likes_review_id' });
  pgm.createIndex('review_comments','review_id',{ name:'idx_review_comments_review_id' });

  // trigger updated_at
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS trigger AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
  `);
  pgm.sql(`CREATE TRIGGER update_users_updated_at  BEFORE UPDATE ON users  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`);
  pgm.sql(`CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`);
};

exports.down = () => {};
