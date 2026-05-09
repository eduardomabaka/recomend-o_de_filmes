-- Execute once on existing installs (MySQL/MariaDB):
-- mysql -u root sistema_recomendacao_filmes < database/migration_user_quiz_and_recommendation_pick.sql

ALTER TABLE users
  ADD COLUMN favorite_genre_id SMALLINT UNSIGNED NULL DEFAULT NULL AFTER password_hash,
  ADD COLUMN worst_genre_id SMALLINT UNSIGNED NULL DEFAULT NULL AFTER favorite_genre_id,
  ADD COLUMN quiz_answer_2 VARCHAR(160) NULL DEFAULT NULL AFTER worst_genre_id,
  ADD COLUMN quiz_answer_3 VARCHAR(160) NULL DEFAULT NULL AFTER quiz_answer_2;

CREATE TABLE IF NOT EXISTS recommendation_picks (
  user_id INT NOT NULL,
  source_tmdb_movie_id INT NOT NULL,
  picked_tmdb_movie_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, source_tmdb_movie_id),
  CONSTRAINT fk_recommendation_pick_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
