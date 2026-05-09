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

    public static function isFavorite(int $userId, int $tmdbMovieId): bool
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT 1 FROM favorites WHERE user_id = :uid AND tmdb_movie_id = :mid LIMIT 1');
        $stmt->execute(['uid' => $userId, 'mid' => $tmdbMovieId]);
        return (bool)$stmt->fetchColumn();
    }

    public static function getRecommendationPick(int $userId, int $sourceTmdbMovieId): ?array
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'SELECT picked_tmdb_movie_id, created_at
             FROM recommendation_picks
             WHERE user_id = :uid AND source_tmdb_movie_id = :src
             LIMIT 1'
        );
        $stmt->execute(['uid' => $userId, 'src' => $sourceTmdbMovieId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function setRecommendationPick(int $userId, int $sourceTmdbMovieId, int $pickedTmdbMovieId): void
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'INSERT INTO recommendation_picks (user_id, source_tmdb_movie_id, picked_tmdb_movie_id)
             VALUES (:uid, :src, :pick)
             ON DUPLICATE KEY UPDATE picked_tmdb_movie_id = VALUES(picked_tmdb_movie_id)'
        );
        $stmt->execute(['uid' => $userId, 'src' => $sourceTmdbMovieId, 'pick' => $pickedTmdbMovieId]);
    }

    public static function clearRecommendationPick(int $userId, int $sourceTmdbMovieId): void
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'DELETE FROM recommendation_picks WHERE user_id = :uid AND source_tmdb_movie_id = :src'
        );
        $stmt->execute(['uid' => $userId, 'src' => $sourceTmdbMovieId]);
    }
}

