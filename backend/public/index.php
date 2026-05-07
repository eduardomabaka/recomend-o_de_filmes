<?php

declare(strict_types=1);

session_start();

require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/MovieController.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
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
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

// Router simples
$result = null;

if ($method === 'POST' && $path === '/api/auth/register') {
    $result = AuthController::register(jsonBody());
} elseif ($method === 'POST' && $path === '/api/auth/login') {
    $result = AuthController::login(jsonBody());
} elseif ($method === 'POST' && $path === '/api/auth/logout') {
    $result = AuthController::logout();
} elseif ($method === 'GET' && $path === '/api/auth/me') {
    $result = AuthController::me();
} elseif ($method === 'GET' && $path === '/api/movies/popular') {
    $result = MovieController::popular($_GET);
} elseif ($method === 'GET' && $path === '/api/movies/search') {
    $result = MovieController::search($_GET);
} elseif ($method === 'GET' && $path === '/api/movies/recommendations') {
    $result = MovieController::recommendations($_GET);
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

