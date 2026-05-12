<?php

declare(strict_types=1);

require_once __DIR__ . '/../models/Movie.php';
require_once __DIR__ . '/../models/User.php';
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

    public static function genres(array $query): array
    {
        $lang = (string)($query['lang'] ?? 'pt-PT');

        $tmdb = new TmdbService();
        return ['status' => 200, 'data' => $tmdb->getMovieGenres($lang)];
    }

    public static function recommendations(array $query): array
    {
        $mid = (int)($query['movieId'] ?? 0);
        if ($mid <= 0) {
            return ['status' => 422, 'data' => ['error' => 'movieId é obrigatório.']];
        }

        $lang = (string)($query['lang'] ?? 'pt-PT');
        $appPage = max(1, (int)($query['page'] ?? 1));
        $tmdbPage = intdiv($appPage - 1, 2) + 1;

        $tmdb = new TmdbService();
        $payload = $tmdb->getRecommendations($mid, $lang, $tmdbPage);

        if (isset($payload['error']) && $payload['error'] !== '') {
            return ['status' => 200, 'data' => $payload];
        }

        $payload = self::applyAppPagination($payload, $appPage);

        $uid = (int)($_SESSION['user_id'] ?? 0);
        if ($uid > 0) {
            $prefs = User::findGenrePrefsById($uid);
            if ($prefs && ($prefs['favorite_genre_id'] !== null || $prefs['worst_genre_id'] !== null)) {
                $payload = self::rankRecommendations($payload, $prefs['favorite_genre_id'], $prefs['worst_genre_id']);
            }
        }

        return ['status' => 200, 'data' => $payload];
    }

    private static function applyAppPagination(array $payload, int $appPage): array
    {
        $results = $payload['results'] ?? null;
        if (!is_array($results)) {
            $payload['page'] = $appPage;
            $payload['total_pages'] = 1;
            $payload['total_results'] = 0;
            return $payload;
        }

        $totalResults = isset($payload['total_results']) ? (int)$payload['total_results'] : count($results);
        $appTotalPages = (int)max(1, ceil($totalResults / 10));
        $offset = (($appPage - 1) % 2) * 10;
        $payload['results'] = array_slice($results, $offset, 10);
        $payload['page'] = $appPage;
        $payload['total_pages'] = $appTotalPages;
        $payload['total_results'] = $totalResults;

        return $payload;
    }

    public static function getRecommendationPick(array $query): array
    {
        $uid = (int)($_SESSION['user_id'] ?? 0);
        if ($uid <= 0) {
            return ['status' => 401, 'data' => ['error' => 'Não autenticado.']];
        }

        $src = (int)($query['sourceMovieId'] ?? 0);
        if ($src <= 0) {
            return ['status' => 422, 'data' => ['error' => 'sourceMovieId é obrigatório.']];
        }

        $row = Movie::getRecommendationPick($uid, $src);

        return [
            'status' => 200,
            'data' => ['picked_tmdb_movie_id' => $row ? (int)$row['picked_tmdb_movie_id'] : null],
        ];
    }

    public static function upsertRecommendationPick(array $body): array
    {
        $uid = (int)($_SESSION['user_id'] ?? 0);
        if ($uid <= 0) {
            return ['status' => 401, 'data' => ['error' => 'Não autenticado.']];
        }

        $src = (int)($body['sourceMovieId'] ?? 0);
        $pick = (int)($body['pickedTmdbMovieId'] ?? 0);
        if ($src <= 0 || $pick <= 0) {
            return ['status' => 422, 'data' => ['error' => 'sourceMovieId e pickedTmdbMovieId são obrigatórios.']];
        }

        Movie::setRecommendationPick($uid, $src, $pick);

        return ['status' => 200, 'data' => ['picked_tmdb_movie_id' => $pick]];
    }

    public static function clearRecommendationPick(array $query): array
    {
        $uid = (int)($_SESSION['user_id'] ?? 0);
        if ($uid <= 0) {
            return ['status' => 401, 'data' => ['error' => 'Não autenticado.']];
        }

        $src = (int)($query['sourceMovieId'] ?? 0);
        if ($src <= 0) {
            return ['status' => 422, 'data' => ['error' => 'sourceMovieId é obrigatório.']];
        }

        Movie::clearRecommendationPick($uid, $src);

        return ['status' => 200, 'data' => ['picked_tmdb_movie_id' => null]];
    }

    public static function details(array $query): array
    {
        $mid = (int)($query['movieId'] ?? 0);
        if ($mid <= 0) {
            return ['status' => 422, 'data' => ['error' => 'movieId é obrigatório.']];
        }

        $lang = (string)($query['lang'] ?? 'pt-PT');

        $tmdb = new TmdbService();
        return ['status' => 200, 'data' => $tmdb->getMovieDetails($mid, $lang)];
    }

    public static function watchProviders(array $query): array
    {
        $mid = (int)($query['movieId'] ?? 0);
        if ($mid <= 0) {
            return ['status' => 422, 'data' => ['error' => 'movieId é obrigatório.']];
        }

        $tmdb = new TmdbService();
        return ['status' => 200, 'data' => $tmdb->getWatchProviders($mid)];
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

    public static function toggleFavorite(array $body): array
    {
        $uid = (int)($_SESSION['user_id'] ?? 0);
        if ($uid <= 0) {
            return ['status' => 401, 'data' => ['error' => 'Não autenticado.']];
        }

        $mid = (int)($body['tmdb_movie_id'] ?? 0);
        if ($mid <= 0) {
            return ['status' => 422, 'data' => ['error' => 'tmdb_movie_id é obrigatório.']];
        }

        $isFavorite = Movie::isFavorite($uid, $mid);
        if ($isFavorite) {
            Movie::removeFavorite($uid, $mid);
            return ['status' => 200, 'data' => ['is_favorite' => false]];
        } else {
            Movie::addFavorite($uid, $mid);
            return ['status' => 200, 'data' => ['is_favorite' => true]];
        }
    }

    private static function rankRecommendations(array $payload, ?int $favoriteGenreId, ?int $worstGenreId): array
    {
        $results = $payload['results'] ?? null;
        if (!is_array($results)) {
            return $payload;
        }

        $bestBucket = [];
        $neutralBucket = [];
        $worstBucket = [];

        foreach ($results as $movie) {
            if (!is_array($movie)) {
                $neutralBucket[] = $movie;
                continue;
            }

            $genreIds = $movie['genre_ids'] ?? [];
            if (!is_array($genreIds)) {
                $genreIds = [];
            }

            $hasWorst = $worstGenreId !== null && in_array($worstGenreId, $genreIds, true);
            $hasFav = $favoriteGenreId !== null && in_array($favoriteGenreId, $genreIds, true);

            if ($hasWorst) {
                $worstBucket[] = $movie;
            } elseif ($hasFav) {
                $bestBucket[] = $movie;
            } else {
                $neutralBucket[] = $movie;
            }
        }

        $payload['results'] = array_merge($bestBucket, $neutralBucket, $worstBucket);

        return $payload;
    }
}

