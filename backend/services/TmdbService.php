<?php

declare(strict_types=1);

final class TmdbService
{
    private string $apiKey;
    private string $readAccessToken;
    private string $baseUrl;
    private string $cacheDir;

    public function __construct(?string $apiKey = null, string $baseUrl = 'https://api.themoviedb.org/3')
    {
        $this->apiKey = $apiKey ?: (string)(getenv('TMDB_API_KEY') ?: '');
        $this->readAccessToken = (string)(getenv('TMDB_READ_ACCESS_TOKEN') ?: '');
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->cacheDir = __DIR__ . '/../storage/cache/tmdb';
    }

    public function searchMovies(string $query, string $language = 'pt-PT', int $page = 1): array
    {
        return $this->get('/search/movie', [
            'query' => $query,
            'language' => $language,
            'page' => $page,
            'include_adult' => 'false',
        ]);
    }

    public function getPopular(string $language = 'pt-PT', int $page = 1): array
    {
        return $this->get('/movie/popular', [
            'language' => $language,
            'page' => $page,
        ]);
    }

    public function getMovieGenres(string $language = 'pt-PT'): array
    {
        return $this->get('/genre/movie/list', [
            'language' => $language,
        ]);
    }

    public function getRecommendations(int $tmdbMovieId, string $language = 'pt-PT', int $page = 1): array
    {
        return $this->get("/movie/{$tmdbMovieId}/recommendations", [
            'language' => $language,
            'page' => $page,
        ]);
    }

    public function getMovieDetails(int $tmdbMovieId, string $language = 'pt-PT'): array
    {
        return $this->get("/movie/{$tmdbMovieId}", [
            'language' => $language,
        ]);
    }

    public function getWatchProviders(int $tmdbMovieId): array
    {
        return $this->get("/movie/{$tmdbMovieId}/watch/providers", []);
    }

    private function get(string $path, array $query): array
    {
        if ($this->apiKey === '' && $this->readAccessToken === '') {
            return [
                'error' => 'TMDB_API_KEY ou TMDB_READ_ACCESS_TOKEN não configurada.',
            ];
        }

        $cacheKey = $this->buildCacheKey($path, $query);
        $cached = $this->readCache($cacheKey);
        if ($cached !== null) {
            return $cached;
        }

        if ($this->apiKey !== '') {
            $query = array_merge($query, ['api_key' => $this->apiKey]);
        }
        $url = $this->baseUrl . $path . '?' . http_build_query($query);
        $headers = "Accept: application/json\r\n";
        if ($this->readAccessToken !== '') {
            $headers .= "Authorization: Bearer {$this->readAccessToken}\r\n";
        }

        $ctx = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 10,
                'header' => $headers,
            ],
        ]);

        $raw = @file_get_contents($url, false, $ctx);
        if ($raw === false) {
            return ['error' => 'Falha ao conectar na API do TMDB.'];
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return ['error' => 'Resposta inválida do TMDB.'];
        }

        $this->writeCache($cacheKey, $decoded);
        return $decoded;
    }

    private function buildCacheKey(string $path, array $query): string
    {
        ksort($query);
        return sha1($path . '|' . json_encode($query, JSON_UNESCAPED_UNICODE));
    }

    private function cacheFilePath(string $cacheKey): string
    {
        return $this->cacheDir . '/' . $cacheKey . '.json';
    }

    private function readCache(string $cacheKey): ?array
    {
        $file = $this->cacheFilePath($cacheKey);
        if (!is_file($file)) {
            return null;
        }

        // Cache curto para manter dados frescos.
        $ttlSeconds = 300;
        $mtime = filemtime($file);
        if ($mtime === false || (time() - $mtime) > $ttlSeconds) {
            return null;
        }

        $raw = file_get_contents($file);
        if ($raw === false || $raw === '') {
            return null;
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : null;
    }

    private function writeCache(string $cacheKey, array $payload): void
    {
        if (!is_dir($this->cacheDir)) {
            @mkdir($this->cacheDir, 0775, true);
        }

        if (!is_dir($this->cacheDir) || !is_writable($this->cacheDir)) {
            return;
        }

        $file = $this->cacheFilePath($cacheKey);
        @file_put_contents($file, json_encode($payload, JSON_UNESCAPED_UNICODE));
    }
}

