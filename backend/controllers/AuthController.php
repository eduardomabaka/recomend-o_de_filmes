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

        $quiz = $body['quiz'] ?? null;
        if (!is_array($quiz)) {
            return ['status' => 422, 'data' => ['error' => 'Quiz obrigatório.']];
        }

        $favGenre = (int)($quiz['favorite_genre_id'] ?? 0);
        $worstGenre = (int)($quiz['worst_genre_id'] ?? 0);
        $q2 = trim((string)($quiz['quiz_answer_2'] ?? ''));
        $q3 = trim((string)($quiz['quiz_answer_3'] ?? ''));

        if ($favGenre <= 0 || $worstGenre <= 0) {
            return ['status' => 422, 'data' => ['error' => 'Indique géneros favorito e género menos apreciado.']];
        }
        if ($favGenre === $worstGenre) {
            return ['status' => 422, 'data' => ['error' => 'O género favorito deve ser diferente do género menos apreciado.']];
        }
        if ($q2 === '' || $q3 === '') {
            return ['status' => 422, 'data' => ['error' => 'Responda às perguntas 2 e 3 do questionário.']];
        }

        try {
            $userId = User::create($name, $email, $password, [
                'favorite_genre_id' => $favGenre,
                'worst_genre_id' => $worstGenre,
                'quiz_answer_2' => $q2,
                'quiz_answer_3' => $q3,
            ]);
        } catch (\PDOException $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'Unknown column') || str_contains($msg, 'favorite_genre_id')) {
                return [
                    'status' => 503,
                    'data' => [
                        'error' =>
                            'A base de dados ainda não tem as colunas do questionário. Na pasta database/ rode o script migration_user_quiz_and_recommendation_pick.sql (phpMyAdmin ou mysql CLI) e volte a tentar.',
                    ],
                ];
            }
            return ['status' => 500, 'data' => ['error' => 'Erro ao guardar a conta na base de dados.']];
        }

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
