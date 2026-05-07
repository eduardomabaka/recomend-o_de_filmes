<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

final class Movie
{
    public static function listFavorites(int $userId): array
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT tmdb_movie_id, created_at FROM favorites WHERE user_id = :uid ORDER BY created_at DESC');
        $stmt->execute(['uid' => $userId]);
        return $stmt->fetchAll() ?: [];
    }

    public static function addFavorite(int $userId, int $tmdbMovieId): void
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'INSERT INTO favorites (user_id, tmdb_movie_id) VALUES (:uid, :mid)
             ON DUPLICATE KEY UPDATE created_at = created_at'
        );
        $stmt->execute(['uid' => $userId, 'mid' => $tmdbMovieId]);
    }

    public static function removeFavorite(int $userId, int $tmdbMovieId): void
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('DELETE FROM favorites WHERE user_id = :uid AND tmdb_movie_id = :mid');
        $stmt->execute(['uid' => $userId, 'mid' => $tmdbMovieId]);
    }
}

