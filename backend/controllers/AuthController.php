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

    public static function updateProfile(array $body): array
    {
        $uid = (int)($_SESSION['user_id'] ?? 0);
        if ($uid <= 0) {
            return ['status' => 401, 'data' => ['error' => 'Não autenticado.']];
        }

        $name = trim((string)($body['name'] ?? ''));
        $email = trim((string)($body['email'] ?? ''));
        $password = (string)($body['password'] ?? '');

        if ($name === '' || $email === '') {
            return ['status' => 422, 'data' => ['error' => 'Nome e email são obrigatórios.']];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['status' => 422, 'data' => ['error' => 'Email inválido.']];
        }

        if ($password !== '' && strlen($password) < 6) {
            return ['status' => 422, 'data' => ['error' => 'A nova palavra-passe deve ter pelo menos 6 caracteres.']];
        }

        if (User::emailExistsForAnotherUser($email, $uid)) {
            return ['status' => 409, 'data' => ['error' => 'Email já registado por outro utilizador.']];
        }

        User::updateProfile($uid, $name, $email, $password !== '' ? $password : null);
        return ['status' => 200, 'data' => ['user' => User::findById($uid)]];
    }
}
