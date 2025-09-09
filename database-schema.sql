-- Esquema de base de datos para el sistema de Reviews & Ratings

-- CREATE DATABASE reviews_ratings;
-- \c reviews_ratings;

-- Tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    profile_image VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de películas (mock data para integración futura con módulo de películas)
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    year INTEGER,
    genre VARCHAR(100),
    director VARCHAR(100),
    poster_url VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de reseñas (tabla principal del módulo)
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    has_spoilers BOOLEAN DEFAULT FALSE,
    tags TEXT[], -- Array de tags: ['spoiler free', 'acción', 'oscars']
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de likes de reseñas (para HU-008 ordenamiento por likes)
CREATE TABLE review_likes (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id, user_id) -- Un usuario solo puede dar un like por reseña
);

-- Tabla de comentarios de reseñas (funcionalidad adicional)
CREATE TABLE review_comments (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance en consultas frecuentes
CREATE INDEX idx_reviews_movie_id ON reviews(movie_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_reviews_has_spoilers ON reviews(has_spoilers);
CREATE INDEX idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX idx_review_comments_review_id ON review_comments(review_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos de ejemplo para testing

-- Insertar usuarios de ejemplo
INSERT INTO users (name, email, profile_image, bio) VALUES
('usuario_actual', 'usuario@example.com', 'https://via.placeholder.com/100x100/2C3E50/ECF0F1?text=UA', 'Amante del cine y crítico ocasional'),
('scifi_lover', 'scifi@example.com', 'https://via.placeholder.com/100x100/E74C3C/ECF0F1?text=SF', 'Especialista en ciencia ficción'),
('cinema_critic', 'critic@example.com', 'https://via.placeholder.com/100x100/1ABC9C/ECF0F1?text=CC', 'Crítico profesional de cine'),
('action_fan', 'action@example.com', 'https://via.placeholder.com/100x100/F39C12/ECF0F1?text=AF', 'Fan de películas de acción');

-- Insertar películas de ejemplo
INSERT INTO movies (title, year, genre, director, poster_url, description) VALUES
('El Padrino', 1972, 'drama', 'Francis Ford Coppola', 'https://via.placeholder.com/120x180/2C3E50/ECF0F1?text=El+Padrino', 'La historia de una familia mafiosa'),
('Blade Runner 2049', 2017, 'ciencia-ficcion', 'Denis Villeneuve', 'https://via.placeholder.com/120x180/E74C3C/ECF0F1?text=Blade+Runner', 'Secuela del clásico de ciencia ficción'),
('Parasite', 2019, 'thriller', 'Bong Joon-ho', 'https://via.placeholder.com/120x180/1ABC9C/ECF0F1?text=Parasite', 'Thriller social coreano'),
('Mad Max: Fury Road', 2015, 'accion', 'George Miller', 'https://via.placeholder.com/120x180/F39C12/ECF0F1?text=Mad+Max', 'Película de acción post-apocalíptica'),
('Her', 2013, 'romance', 'Spike Jonze', 'https://via.placeholder.com/120x180/9B59B6/ECF0F1?text=Her', 'Historia de amor en la era digital');

-- Insertar reseñas de ejemplo
INSERT INTO reviews (movie_id, user_id, title, body, rating, has_spoilers, tags) VALUES
(1, 1, 'Una obra maestra del cine', 'Una obra maestra absoluta del cine. La narrativa de Coppola es impecable, combinando drama familiar con elementos del crimen de manera magistral.', 5, false, ARRAY['Obra Maestra', 'Drama', 'Spoiler Free']),
(2, 2, 'Secuela digna del original', 'Denis Villeneuve logra crear una secuela que honra al original mientras construye algo completamente nuevo. La cinematografía es deslumbrante.', 4, false, ARRAY['Ciencia Ficción', 'Spoiler Free']),
(3, 3, 'Crítica social brillante', 'Bong Joon-ho presenta una crítica social brillante envuelta en un thriller impredecible. La película funciona en múltiples niveles.', 5, false, ARRAY['Thriller', 'Obra Maestra']),
(4, 4, 'Acción coreografiada', 'George Miller demuestra que las películas de acción pueden ser arte. Cada secuencia de acción está coreografiada con precisión cinematográfica.', 4, false, ARRAY['Acción', 'Spoiler Free']),
(5, 1, 'Historia de amor única', 'Spike Jonze crea una historia de amor única y profundamente humana sobre la conexión en la era digital.', 4, false, ARRAY['Romance', 'Drama']);

-- Insertar algunos likes de ejemplo
INSERT INTO review_likes (review_id, user_id) VALUES
(1, 2), (1, 3), (1, 4),
(2, 1), (2, 3),
(3, 1), (3, 2), (3, 4),
(4, 1), (4, 2),
(5, 2), (5, 3);

-- Ver el estado de las tablas
SELECT 'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'movies' AS table_name, COUNT(*) AS count FROM movies
UNION ALL
SELECT 'reviews' AS table_name, COUNT(*) AS count FROM reviews
UNION ALL
SELECT 'review_likes' AS table_name, COUNT(*) AS count FROM review_likes;
