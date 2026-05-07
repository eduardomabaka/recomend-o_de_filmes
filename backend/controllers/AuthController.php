<?php

declare(strict_types=1);

require_once __DIR__ . '/../models/User.php';

final class AuthController
{
    public static function register(array $body): array
    {
        $name = trim((string)($body['name'] ?? ''));
        $email = trim((string)($body['email'] ?? ''));
        $password = (string)($body['password'] ?? '');

        if ($name === '' || $email === '' || $password === '') {
            return ['status' => 422, 'data' => ['error' => 'Campos inválidos.']];
        }

        if (User::findByEmail($email)) {
            return ['status' => 409, 'data' => ['error' => 'Email já registado.']];
        }

        $userId = User::create($name, $email, $password);
        $_SESSION['user_id'] = $userId;

        return ['status' => 201, 'data' => ['user' => User::findById($userId)]];
    }

    public static function login(array $body): array
    {
        $email = trim((string)($body['email'] ?? ''));
        $password = (string)($body['password'] ?? '');

        if ($email === '' || $password === '') {
            return ['status' => 422, 'data' => ['error' => 'Campos inválidos.']];
        }

        $user = User::findByEmail($email);
        if (!$user || !password_verify($password, (string)$user['password_hash'])) {
            return ['status' => 401, 'data' => ['error' => 'Credenciais inválidas.']];
        }

        $_SESSION['user_id'] = (int)$user['id'];
        return ['status' => 200, 'data' => ['user' => User::findById((int)$user['id'])]];
    }

    public static function logout(): array
    {
        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
        return ['status' => 200, 'data' => ['ok' => true]];
    }

    public static function me(): array
    {
        $uid = (int)($_SESSION['user_id'] ?? 0);
        if ($uid <= 0) {
            return ['status' => 401, 'data' => ['error' => 'Não autenticado.']];
        }
        return ['status' => 200, 'data' => ['user' => User::findById($uid)]];
    }
}

