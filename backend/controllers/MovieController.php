<?php

declare(strict_types=1);

require_once __DIR__ . '/../models/Movie.php';
require_once __DIR__ . '/../services/TmdbService.php';

final class MovieController
{
    public static function popular(array $query): array
    {
        $lang = (string)($query['lang'] ?? 'pt-PT');
        $page = max(1, (int)($query['page'] ?? 1));

        $tmdb = new TmdbService();
        return ['status' => 200, 'data' => $tmdb->getPopular($lang, $page)];
    }

    public static function search(array $query): array
    {
        $q = trim((string)($query['q'] ?? ''));
        if ($q === '') {
            return ['status' => 422, 'data' => ['error' => 'Parâmetro q é obrigatório.']];
        }

        $lang = (string)($query['lang'] ?? 'pt-PT');
        $page = max(1, (int)($query['page'] ?? 1));

        $tmdb = new TmdbService();
        return ['status' => 200, 'data' => $tmdb->searchMovies($q, $lang, $page)];
    }

    public static function recommendations(array $query): array
    {
        $mid = (int)($query['movieId'] ?? 0);
        if ($mid <= 0) {
            return ['status' => 422, 'data' => ['error' => 'movieId é obrigatório.']];
        }

        $lang = (string)($query['lang'] ?? 'pt-PT');
        $page = max(1, (int)($query['page'] ?? 1));

        $tmdb = new TmdbService();
        return ['status' => 200, 'data' => $tmdb->getRecommendations($mid, $lang, $page)];
    }

    public static function listFavorites(): array
    {
        $uid = (int)($_SESSION['user_id'] ?? 0);
        if ($uid <= 0) {
            return ['status' => 401, 'data' => ['error' => 'Não autenticado.']];
        }
        return ['status' => 200, 'data' => ['favorites' => Movie::listFavorites($uid)]];
    }

    public static function addFavorite(array $body): array
    {
        $uid = (int)($_SESSION['user_id'] ?? 0);
        if ($uid <= 0) {
            return ['status' => 401, 'data' => ['error' => 'Não autenticado.']];
        }

        $mid = (int)($body['tmdb_movie_id'] ?? 0);
        if ($mid <= 0) {
            return ['status' => 422, 'data' => ['error' => 'tmdb_movie_id é obrigatório.']];
        }

        Movie::addFavorite($uid, $mid);
        return ['status' => 201, 'data' => ['ok' => true]];
    }

    public static function removeFavorite(array $query): array
    {
        $uid = (int)($_SESSION['user_id'] ?? 0);
        if ($uid <= 0) {
            return ['status' => 401, 'data' => ['error' => 'Não autenticado.']];
        }

        $mid = (int)($query['tmdb_movie_id'] ?? 0);
        if ($mid <= 0) {
            return ['status' => 422, 'data' => ['error' => 'tmdb_movie_id é obrigatório.']];
        }

        Movie::removeFavorite($uid, $mid);
        return ['status' => 200, 'data' => ['ok' => true]];
    }
}

