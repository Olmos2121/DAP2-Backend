-- Script simplificado para Node.js - sin comandos psql específicos

-- Limpiar tablas existentes
DROP TABLE IF EXISTS review_comments CASCADE;
DROP TABLE IF EXISTS review_likes CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Eliminar funciones y triggers si existen
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP FUNCTION IF EXISTS update_updated_at_column();

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

-- Tabla de películas
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
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de likes de reseñas
CREATE TABLE review_likes (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id, user_id)
);

-- Tabla de comentarios de reseñas
CREATE TABLE review_comments (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
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

-- Insertar usuarios de ejemplo
INSERT INTO users (name, email, profile_image, bio) VALUES
('Admin', 'admin@moviereviews.com', 'https://via.placeholder.com/100x100/2C3E50/ECF0F1?text=AD', 'Administrador del sistema de reseñas'),
('Juan Pérez', 'juan@example.com', 'https://via.placeholder.com/100x100/E74C3C/ECF0F1?text=JP', 'Amante del cine y crítico ocasional'),
('María García', 'maria@example.com', 'https://via.placeholder.com/100x100/1ABC9C/ECF0F1?text=MG', 'Especialista en ciencia ficción'),
('Carlos López', 'carlos@example.com', 'https://via.placeholder.com/100x100/F39C12/ECF0F1?text=CL', 'Crítico profesional de cine'),
('Ana Martín', 'ana@example.com', 'https://via.placeholder.com/100x100/9B59B6/ECF0F1?text=AM', 'Fan de películas de acción'),
('Luis Rodríguez', 'luis@example.com', 'https://via.placeholder.com/100x100/3498DB/ECF0F1?text=LR', 'Cinéfilo y coleccionista');

-- Insertar películas populares
INSERT INTO movies (title, year, genre, director, poster_url, description) VALUES
('El Padrino', 1972, 'Drama', 'Francis Ford Coppola', 'https://image.tmdb.org/t/p/w300/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', 'La historia épica de una familia mafiosa italiana en Nueva York'),
('Pulp Fiction', 1994, 'Crimen', 'Quentin Tarantino', 'https://image.tmdb.org/t/p/w300/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', 'Historias entrelazadas del crimen en Los Ángeles'),
('El Caballero de la Noche', 2008, 'Acción', 'Christopher Nolan', 'https://image.tmdb.org/t/p/w300/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 'Batman enfrenta al Joker en una batalla épica por Gotham'),
('Forrest Gump', 1994, 'Drama', 'Robert Zemeckis', 'https://image.tmdb.org/t/p/w300/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', 'La extraordinaria vida de un hombre simple pero extraordinario'),
('Inception', 2010, 'Ciencia Ficción', 'Christopher Nolan', 'https://image.tmdb.org/t/p/w300/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', 'Un ladrón que roba secretos del subconsciente'),
('Parasite', 2019, 'Thriller', 'Bong Joon-ho', 'https://image.tmdb.org/t/p/w300/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', 'Una familia pobre se infiltra en la vida de una familia rica'),
('Titanic', 1997, 'Romance', 'James Cameron', 'https://image.tmdb.org/t/p/w300/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', 'Historia de amor épica en el barco más famoso del mundo'),
('Matrix', 1999, 'Ciencia Ficción', 'Lana Wachowski', 'https://image.tmdb.org/t/p/w300/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', 'Un programador descubre que la realidad es una simulación'),
('El Señor de los Anillos: La Comunidad del Anillo', 2001, 'Fantasía', 'Peter Jackson', 'https://image.tmdb.org/t/p/w300/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', 'El inicio de la épica aventura en la Tierra Media'),
('Gladiador', 2000, 'Acción', 'Ridley Scott', 'https://image.tmdb.org/t/p/w300/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg', 'Un general romano busca venganza como gladiador'),
('Los Vengadores', 2012, 'Acción', 'Joss Whedon', 'https://image.tmdb.org/t/p/w300/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg', 'Los superhéroes más poderosos se unen para salvar el mundo'),
('La La Land', 2016, 'Musical', 'Damien Chazelle', 'https://image.tmdb.org/t/p/w300/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', 'Historia de amor entre una aspirante a actriz y un músico de jazz'),
('Mad Max: Fury Road', 2015, 'Acción', 'George Miller', 'https://image.tmdb.org/t/p/w300/hA2ple9q4qnwxp3hKVNhroipsir.jpg', 'Persecución épica en un mundo post-apocalíptico'),
('Her', 2013, 'Romance', 'Spike Jonze', 'https://image.tmdb.org/t/p/w300/lEIaL12hSkqqe83kgADkbUqEnvk.jpg', 'Historia de amor entre un hombre y una inteligencia artificial'),
('Coco', 2017, 'Animación', 'Lee Unkrich', 'https://image.tmdb.org/t/p/w300/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg', 'Un niño viaja al mundo de los muertos para encontrar a su familia');

-- Insertar reseñas variadas
INSERT INTO reviews (movie_id, user_id, title, body, rating, has_spoilers, tags) VALUES
(1, 2, 'Una obra maestra absoluta', 'El Padrino no es solo una película, es una experiencia cinematográfica que trasciende el tiempo. Coppola logra crear una narrativa épica que funciona tanto como drama familiar como thriller criminal. La actuación de Marlon Brando es legendaria.', 5, false, ARRAY['Obra Maestra', 'Drama', 'Clásico']),
(1, 3, 'Perfección en cada escena', 'Cada escena está meticulosamente crafteada. La fotografía, la música, las actuaciones... todo está en perfecta armonía. Es imposible encontrar un defecto en esta película.', 5, false, ARRAY['Perfección', 'Cinematografía']),
(2, 1, 'Tarantino en su mejor momento', 'Pulp Fiction redefinió el cine de los 90. La estructura narrativa no lineal, los diálogos brillantes y las actuaciones memorables hacen de esta película un clásico instantáneo.', 5, false, ARRAY['Tarantino', 'Narrativa', 'Clásico']),
(3, 4, 'Heath Ledger es el Joker perfecto', 'La interpretación de Heath Ledger como el Joker es probablemente una de las mejores actuaciones villanas en la historia del cine. Nolan creó la película de superhéroes definitiva.', 5, false, ARRAY['Heath Ledger', 'Superhéroes', 'Actuación']),
(4, 5, 'Emotiva y entrañable', 'Forrest Gump es una película que te hace reír y llorar al mismo tiempo. Tom Hanks está absolutamente brillante en su papel de un hombre simple con un corazón enorme.', 4, false, ARRAY['Tom Hanks', 'Emotiva', 'Drama']),
(5, 6, 'Compleja pero brillante', 'Inception requiere múltiples visionados para ser completamente entendida, pero cada visionado revela nuevas capas de complejidad. Nolan es un maestro de la narrativa compleja.', 4, false, ARRAY['Compleja', 'Nolan', 'Ciencia Ficción']),
(6, 2, 'Crítica social magistral', 'Parasite es mucho más que un thriller. Es una crítica social brillante sobre la desigualdad de clases. Bong Joon-ho merece todos los premios que recibió.', 5, false, ARRAY['Crítica Social', 'Thriller', 'Oscar']),
(7, 3, 'Romance épico', 'Titanic no es solo sobre el barco que se hunde, es sobre el amor que trasciende las diferencias sociales. Cameron creó una película visualmente espectacular y emocionalmente poderosa.', 4, false, ARRAY['Romance', 'Épico', 'Visual']),
(8, 4, 'Revolucionaria', 'Matrix cambió para siempre la forma en que vemos las películas de acción y ciencia ficción. Los efectos especiales fueron revolucionarios y la filosofía detrás es fascinante.', 5, false, ARRAY['Revolucionaria', 'Efectos', 'Filosofía']),
(9, 5, 'Fantasía épica', 'Peter Jackson logró adaptar lo imposible. El Señor de los Anillos es la trilogía de fantasía definitiva, con una atención al detalle extraordinaria.', 5, false, ARRAY['Fantasía', 'Épico', 'Adaptación']),
(10, 1, 'Gladiador es puro espectáculo', 'Russell Crowe está en su mejor momento. Las escenas de combate son brutales y emocionantes. Ridley Scott sabe cómo hacer espectáculo épico.', 4, false, ARRAY['Acción', 'Russell Crowe', 'Épico']),
(11, 6, 'Los superhéroes se unen', 'Después de años de películas individuales, finalmente vemos a todos nuestros héroes favoritos juntos. Es puro entretenimiento de principio a fin.', 4, false, ARRAY['Superhéroes', 'Entretenimiento', 'Marvel']),
(12, 2, 'Musical moderno perfecto', 'La La Land revive el género musical con estilo moderno. Emma Stone y Ryan Gosling tienen una química perfecta, y la música es inolvidable.', 4, false, ARRAY['Musical', 'Romance', 'Música']),
(13, 3, 'Acción sin descanso', 'Mad Max: Fury Road es acción pura desde el primer minuto. George Miller demuestra que se pueden hacer películas de acción inteligentes y emocionantes.', 4, false, ARRAY['Acción', 'Persecución', 'Intensa']),
(14, 4, 'Reflexión sobre el amor', 'Her es una película profundamente reflexiva sobre la conexión humana en la era digital. Joaquin Phoenix está brillante como siempre.', 4, false, ARRAY['Reflexiva', 'Amor', 'Tecnología']),
(15, 5, 'Pixar en su mejor momento', 'Coco es una celebración hermosa de la cultura mexicana y la familia. La animación es espectacular y la historia es profundamente emotiva.', 5, false, ARRAY['Pixar', 'Familia', 'Cultura']);

-- Insertar algunos likes de ejemplo
INSERT INTO review_likes (review_id, user_id) VALUES
(1, 1), (1, 4), (1, 5), (1, 6),
(2, 2), (2, 4), (2, 5),
(3, 3), (3, 4), (3, 6),
(4, 1), (4, 2), (4, 3), (4, 5),
(5, 1), (5, 3), (5, 6),
(6, 1), (6, 2), (6, 5),
(7, 1), (7, 3), (7, 4), (7, 6),
(8, 2), (8, 4), (8, 5),
(9, 1), (9, 2), (9, 3), (9, 6),
(10, 2), (10, 3), (10, 4),
(11, 1), (11, 3), (11, 5),
(12, 1), (12, 4), (12, 6),
(13, 2), (13, 3), (13, 5),
(14, 1), (14, 2), (14, 6),
(15, 1), (15, 2), (15, 3), (15, 4);

-- Insertar algunos comentarios de ejemplo
INSERT INTO review_comments (review_id, user_id, comment) VALUES
(1, 3, 'Totalmente de acuerdo, la actuación de Brando es icónica'),
(1, 4, 'La banda sonora también es perfecta'),
(2, 1, 'Una de mis películas favoritas de todos los tiempos'),
(3, 2, 'Los diálogos de Tarantino son únicos'),
(4, 5, 'Heath Ledger se merecía el Oscar póstumamente'),
(6, 3, 'Cada visionado descubres algo nuevo'),
(7, 4, 'Bong Joon-ho es un genio del cine'),
(9, 2, 'Los efectos prácticos siguen siendo impresionantes'),
(10, 6, 'La música de Howard Shore es épica'),
(15, 6, 'Me hizo llorar, Pixar sabe cómo tocar el corazón');
