<?php

declare(strict_types=1);

session_start();

// Carrega variáveis locais de ambiente (ex.: backend/.env), sem sobrescrever as já definidas no sistema.
$envPath = __DIR__ . '/../.env';
if (is_file($envPath) && is_readable($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#')) {
            continue;
        }

        $parts = explode('=', $trimmed, 2);
        if (count($parts) !== 2) {
            continue;
        }

        $key = trim($parts[0]);
        $value = trim($parts[1]);
        if ($key === '' || getenv($key) !== false) {
            continue;
        }

        putenv("{$key}={$value}");
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/MovieController.php';

header('Content-Type: application/json; charset=utf-8');

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($requestOrigin !== '') {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
    header('Access-Control-Allow-Credentials: true');
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function jsonBody(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

// Normaliza caminhos para funcionar com/sem rewrite e com /index.php no URL.
$path = $requestPath;
$scriptName = (string)($_SERVER['SCRIPT_NAME'] ?? '');
$scriptDir = rtrim(str_replace('\\', '/', dirname($scriptName)), '/');
if ($scriptDir !== '' && $scriptDir !== '.' && str_starts_with($path, $scriptDir . '/')) {
    $path = substr($path, strlen($scriptDir));
}
$indexMarker = '/index.php';
$indexPos = strpos($path, $indexMarker);
if ($indexPos !== false) {
    $path = substr($path, $indexPos + strlen($indexMarker));
}
if ($path === '' || $path[0] !== '/') {
    $path = '/' . ltrim($path, '/');
}

// Router simples
$result = null;

if ($method === 'POST' && $path === '/api/auth/register') {
    $result = AuthController::register(jsonBody());
} elseif ($method === 'POST' && $path === '/api/auth/login') {
    $result = AuthController::login(jsonBody());
} elseif ($method === 'POST' && $path === '/api/auth/logout') {
    $result = AuthController::logout();
} elseif ($method === 'POST' && $path === '/api/auth/profile') {
    $result = AuthController::updateProfile(jsonBody());
} elseif ($method === 'GET' && $path === '/api/auth/me') {
    $result = AuthController::me();
} elseif ($method === 'GET' && $path === '/api/movies/popular') {
    $result = MovieController::popular($_GET);
} elseif ($method === 'GET' && $path === '/api/movies/search') {
    $result = MovieController::search($_GET);
} elseif ($method === 'GET' && $path === '/api/movies/recommendations') {
    $result = MovieController::recommendations($_GET);
} elseif ($method === 'GET' && $path === '/api/movies/details') {
    $result = MovieController::details($_GET);
} elseif ($method === 'GET' && $path === '/api/movies/watch-providers') {
    $result = MovieController::watchProviders($_GET);
} elseif ($method === 'GET' && $path === '/api/movies/favorites') {
    $result = MovieController::listFavorites();
} elseif ($method === 'POST' && $path === '/api/movies/favorites') {
    $result = MovieController::addFavorite(jsonBody());
} elseif ($method === 'DELETE' && $path === '/api/movies/favorites') {
    $result = MovieController::removeFavorite($_GET);
} else {
    $result = ['status' => 404, 'data' => ['error' => 'Rota não encontrada.']];
}

http_response_code((int)($result['status'] ?? 200));
echo json_encode($result['data'] ?? [], JSON_UNESCAPED_UNICODE);
