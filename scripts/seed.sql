BEGIN;

-- Limpia y reinicia los IDs (solo para entornos de desarrollo)
TRUNCATE TABLE review_comments, review_likes, reviews, movies, users
RESTART IDENTITY CASCADE;

-- =========================
-- Users
-- =========================
INSERT INTO users (name, email, profile_image, bio) VALUES
('Admin', 'admin@moviereviews.com', 'https://via.placeholder.com/100x100/2C3E50/ECF0F1?text=AD', 'Administrador del sistema de reseñas'),
('Juan Pérez', 'juan@example.com', 'https://via.placeholder.com/100x100/E74C3C/ECF0F1?text=JP', 'Amante del cine y crítico ocasional'),
('María García', 'maria@example.com', 'https://via.placeholder.com/100x100/1ABC9C/ECF0F1?text=MG', 'Especialista en ciencia ficción'),
('Carlos López', 'carlos@example.com', 'https://via.placeholder.com/100x100/F39C12/ECF0F1?text=CL', 'Crítico profesional de cine'),
('Ana Martín', 'ana@example.com', 'https://via.placeholder.com/100x100/9B59B6/ECF0F1?text=AM', 'Fan de películas de acción'),
('Luis Rodríguez', 'luis@example.com', 'https://via.placeholder.com/100x100/3498DB/ECF0F1?text=LR', 'Cinéfilo y coleccionista');

-- =========================
-- Movies
-- =========================
INSERT INTO movies (title, year, genre, director, poster_url, description) VALUES
('El Padrino', 1972, 'Drama', 'Francis Ford Coppola', 'https://image.tmdb.org/t/p/w300/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', 'La historia épica de una familia mafiosa italiana en Nueva York'),
('Pulp Fiction', 1994, 'Crimen', 'Quentin Tarantino', 'https://image.tmdb.org/t/p/w300/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', 'Historias entrelazadas del crimen en Los Ángeles'),
('El Caballero de la Noche', 2008, 'Acción', 'Christopher Nolan', 'https://image.tmdb.org/t/p/w300/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 'Batman enfrenta al Joker en Gotham'),
('Forrest Gump', 1994, 'Drama', 'Robert Zemeckis', 'https://image.tmdb.org/t/p/w300/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', 'La extraordinaria vida de un hombre simple'),
('Inception', 2010, 'Ciencia Ficción', 'Christopher Nolan', 'https://image.tmdb.org/t/p/w300/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', 'Un ladrón roba secretos del subconsciente'),
('Parasite', 2019, 'Thriller', 'Bong Joon-ho', 'https://image.tmdb.org/t/p/w300/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', 'Crítica social en forma de thriller'),
('Titanic', 1997, 'Romance', 'James Cameron', 'https://image.tmdb.org/t/p/w300/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', 'Historia de amor a bordo del Titanic'),
('Matrix', 1999, 'Ciencia Ficción', 'Lana Wachowski', 'https://image.tmdb.org/t/p/w300/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', 'La realidad es una simulación'),
('El Señor de los Anillos: La Comunidad del Anillo', 2001, 'Fantasía', 'Peter Jackson', 'https://image.tmdb.org/t/p/w300/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', 'Inicio de la aventura en la Tierra Media'),
('Gladiador', 2000, 'Acción', 'Ridley Scott', 'https://image.tmdb.org/t/p/w300/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg', 'Un general romano busca venganza'),
('Los Vengadores', 2012, 'Acción', 'Joss Whedon', 'https://image.tmdb.org/t/p/w300/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg', 'Héroes se unen para salvar el mundo'),
('La La Land', 2016, 'Musical', 'Damien Chazelle', 'https://image.tmdb.org/t/p/w300/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', 'Amor y jazz en Los Ángeles'),
('Mad Max: Fury Road', 2015, 'Acción', 'George Miller', 'https://image.tmdb.org/t/p/w300/hA2ple9q4qnwxp3hKVNhroipsir.jpg', 'Persecución post-apocalíptica'),
('Her', 2013, 'Romance', 'Spike Jonze', 'https://image.tmdb.org/t/p/w300/lEIaL12hSkqqe83kgADkbUqEnvk.jpg', 'Amor en la era digital'),
('Coco', 2017, 'Animación', 'Lee Unkrich', 'https://image.tmdb.org/t/p/w300/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg', 'Celebración de la familia y la cultura');

-- =========================
-- Reviews (rating: 1..5, title requerido, tags opcional)
-- =========================
INSERT INTO reviews (movie_id, user_id, title, body, rating, has_spoilers, tags) VALUES
(1,  2, 'Una obra maestra absoluta', 'El Padrino es una experiencia cinematográfica que trasciende el tiempo.', 5, false, ARRAY['Obra Maestra','Drama','Clásico']),
(1,  3, 'Perfección en cada escena', 'Fotografía, música y actuaciones en perfecta armonía.', 5, false, ARRAY['Perfección','Cinematografía']),
(2,  1, 'Tarantino en su mejor momento', 'Estructura no lineal y diálogos brillantes.', 5, false, ARRAY['Tarantino','Narrativa','Clásico']),
(3,  4, 'Heath Ledger es el Joker perfecto', 'La mejor interpretación villana en el cine reciente.', 5, false, ARRAY['Heath Ledger','Superhéroes','Actuación']),
(4,  5, 'Emotiva y entrañable', 'Te hace reír y llorar. Tom Hanks brillante.', 4, false, ARRAY['Tom Hanks','Emotiva','Drama']),
(5,  6, 'Compleja pero brillante', 'Cada visionado revela nuevas capas.', 4, false, ARRAY['Compleja','Nolan','Ciencia Ficción']),
(6,  2, 'Crítica social magistral', 'Bong Joon-ho y su crítica sobre la desigualdad.', 5, false, ARRAY['Crítica Social','Thriller','Oscar']),
(7,  3, 'Romance épico', 'Visualmente espectacular y emocionalmente poderosa.', 4, false, ARRAY['Romance','Épico','Visual']),
(8,  4, 'Revolucionaria', 'Cambió para siempre la ciencia ficción y la acción.', 5, false, ARRAY['Revolucionaria','Efectos','Filosofía']),
(9,  5, 'Fantasía épica', 'Atención al detalle extraordinaria.', 5, false, ARRAY['Fantasía','Épico','Adaptación']),
(10, 1, 'Puro espectáculo', 'Russell Crowe en su mejor momento, combates brutales.', 4, false, ARRAY['Acción','Épico']),
(11, 6, 'Los superhéroes se unen', 'Puro entretenimiento de principio a fin.', 4, false, ARRAY['Superhéroes','Entretenimiento','Marvel']),
(12, 1, 'Musical moderno perfecto', 'Química perfecta, música inolvidable.', 4, false, ARRAY['Musical','Romance','Música']),
(13, 3, 'Acción sin descanso', 'Acción inteligente y emocionante.', 4, false, ARRAY['Acción','Persecución','Intensa']),
(14, 4, 'Reflexión sobre el amor', 'Profundamente reflexiva sobre la conexión humana.', 4, false, ARRAY['Reflexiva','Amor','Tecnología']),
(15, 5, 'Pixar en su mejor momento', 'Celebración hermosa de la cultura y la familia.', 5, false, ARRAY['Pixar','Familia','Cultura']);

-- =========================
-- Likes (un like por usuario por reseña)
-- =========================
INSERT INTO review_likes (review_id, user_id) VALUES
(1,1), (1,4), (1,5), (1,6),
(2,2), (2,4), (2,5),
(3,3), (3,4), (3,6),
(4,1), (4,2), (4,3), (4,5),
(5,1), (5,3), (5,6),
(6,1), (6,2), (6,5),
(7,1), (7,3), (7,4), (7,6),
(8,2), (8,4), (8,5),
(9,1), (9,2), (9,3), (9,6),
(10,2), (10,3), (10,4),
(11,1), (11,3), (11,5),
(12,1), (12,4), (12,6),
(13,2), (13,3), (13,5),
(14,1), (14,2), (14,6),
(15,1), (15,2), (15,3), (15,4);

-- =========================
-- Comments
-- =========================
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

-- =========================
-- Verificación rápida
-- =========================
SELECT 'users' AS tabla, COUNT(*) AS registros FROM users
UNION ALL SELECT 'movies', COUNT(*) FROM movies
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL SELECT 'review_likes', COUNT(*) FROM review_likes
UNION ALL SELECT 'review_comments', COUNT(*) FROM review_comments;

COMMIT;
