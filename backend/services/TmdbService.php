<?php

declare(strict_types=1);

final class TmdbService
{
    private string $apiKey;
    private string $readAccessToken;
    private string $baseUrl;

    public function __construct(?string $apiKey = null, string $baseUrl = 'https://api.themoviedb.org/3')
    {
        $this->apiKey = $apiKey ?: (string)(getenv('TMDB_API_KEY') ?: '');
        $this->readAccessToken = (string)(getenv('TMDB_READ_ACCESS_TOKEN') ?: '');
        $this->baseUrl = rtrim($baseUrl, '/');
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

    public function getRecommendations(int $tmdbMovieId, string $language = 'pt-PT', int $page = 1): array
    {
        return $this->get("/movie/{$tmdbMovieId}/recommendations", [
            'language' => $language,
            'page' => $page,
        ]);
    }

    private function get(string $path, array $query): array
    {
        if ($this->apiKey === '' && $this->readAccessToken === '') {
            return [
                'error' => 'TMDB_API_KEY ou TMDB_READ_ACCESS_TOKEN não configurada.',
            ];
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

        return $decoded;
    }
}

