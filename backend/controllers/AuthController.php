<?php

declare(strict_types=1);

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/PasswordResetToken.php';
require_once __DIR__ . '/../models/AccountDeletionChallenge.php';
require_once __DIR__ . '/../services/MailService.php';

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

    public static function forgotPassword(array $body): array
    {
        $email = trim((string)($body['email'] ?? ''));
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['status' => 422, 'data' => ['error' => 'Indique um email válido.']];
        }

        $delivery = 'none';

        try {
            $user = User::findByEmail($email);
            if ($user) {
                $uid = (int)$user['id'];
                $token = PasswordResetToken::createForUser($uid);
                $base = self::frontendBaseUrl($body);
                $link = $base . '/reset-password?token=' . rawurlencode($token);
                $name = (string)($user['name'] ?? '');
                $text = "Olá {$name},\n\nPara definir uma nova palavra-passe, abra o link:\n{$link}\n\nO link expira em 1 hora.\n";
                error_log("[AuthController] forgotPassword: a enviar recuperação para user_id={$uid}, baseUrl={$base}");

                $sent = MailService::sendPlain($email, 'Recuperação de palavra-passe', $text);
                if (!$sent) {
                    error_log("[AuthController] forgotPassword: falha no envio/registo de email para {$email}");
                    return [
                        'status' => 503,
                        'data' => [
                            'error' =>
                                'Não foi possível enviar o email neste momento. Verifique permissões da pasta backend/storage, a configuração de email no servidor (MAIL_LOG_ONLY / sendmail) ou tente mais tarde.',
                        ],
                    ];
                }

                $delivery = MailService::shouldLogOnly() ? 'log_file' : 'sent';
                error_log("[AuthController] forgotPassword: pedido concluído com sucesso para user_id={$uid}, delivery={$delivery}");
            }
        } catch (\PDOException $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'password_reset_tokens') || str_contains($msg, "doesn't exist")) {
                return [
                    'status' => 503,
                    'data' => [
                        'error' =>
                            'A base de dados ainda não tem a tabela de recuperação de palavra-passe. Execute database/migration_password_reset_account_deletion.sql.',
                    ],
                ];
            }
            return ['status' => 500, 'data' => ['error' => 'Erro ao processar o pedido.']];
        }

        return [
            'status' => 200,
            'data' => [
                'success' => true,
                'message' => 'Se existir uma conta com este email, receberá instruções para redefinir a palavra-passe.',
                'delivery' => $delivery,
            ],
        ];
    }

    public static function resetPassword(array $body): array
    {
        $token = trim((string)($body['token'] ?? ''));
        $password = (string)($body['password'] ?? '');

        if ($token === '' || $password === '') {
            return ['status' => 422, 'data' => ['error' => 'Token e nova palavra-passe são obrigatórios.']];
        }

        if (strlen($password) < 6) {
            return ['status' => 422, 'data' => ['error' => 'A palavra-passe deve ter pelo menos 6 caracteres.']];
        }

        try {
            $userId = PasswordResetToken::findValidUserId($token);
            if ($userId === null) {
                return ['status' => 400, 'data' => ['error' => 'Link inválido ou expirado.']];
            }

            User::updatePassword($userId, $password);
            PasswordResetToken::deleteByRawToken($token);
        } catch (\PDOException $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'password_reset_tokens') || str_contains($msg, "doesn't exist")) {
                return [
                    'status' => 503,
                    'data' => [
                        'error' =>
                            'A base de dados ainda não tem a tabela de recuperação de palavra-passe. Execute database/migration_password_reset_account_deletion.sql.',
                    ],
                ];
            }
            return ['status' => 500, 'data' => ['error' => 'Erro ao atualizar a palavra-passe.']];
        }

        return [
            'status' => 200,
            'data' => ['success' => true, 'message' => 'Palavra-passe atualizada. Já pode entrar com a nova palavra-passe.'],
        ];
    }

    public static function requestAccountDeletion(): array
    {
        $uid = (int)($_SESSION['user_id'] ?? 0);
        if ($uid <= 0) {
            return ['status' => 401, 'data' => ['error' => 'Não autenticado.']];
        }

        $user = User::findById($uid);
        if (!$user) {
            return ['status' => 401, 'data' => ['error' => 'Não autenticado.']];
        }

        try {
            $code = AccountDeletionChallenge::issue($uid);
        } catch (\PDOException $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'account_deletion_challenges') || str_contains($msg, "doesn't exist")) {
                return [
                    'status' => 503,
                    'data' => [
                        'error' =>
                            'A base de dados ainda não tem a tabela de confirmação de exclusão. Execute database/migration_password_reset_account_deletion.sql.',
                    ],
                ];
            }
            return ['status' => 500, 'data' => ['error' => 'Erro ao gerar o código.']];
        }

        $email = (string)$user['email'];
        $name = (string)$user['name'];
        $text = "Olá {$name},\n\nRecebeu este email porque pediu para eliminar a conta na F Zone.\n\nCódigo de confirmação (válido 10 minutos): {$code}\n\nSe não foi você, ignore este email.\n";
        MailService::sendPlain($email, 'Confirmação de eliminação de conta', $text);

        return ['status' => 200, 'data' => ['success' => true, 'message' => 'Foi enviado um email com o código de confirmação.']];
    }

    public static function confirmAccountDeletion(array $body): array
    {
        $uid = (int)($_SESSION['user_id'] ?? 0);
        if ($uid <= 0) {
            return ['status' => 401, 'data' => ['error' => 'Não autenticado.']];
        }

        $code = trim((string)($body['code'] ?? ''));
        if ($code === '') {
            return ['status' => 422, 'data' => ['error' => 'Indique o código recebido por email.']];
        }

        try {
            $result = AccountDeletionChallenge::verify($uid, $code);
        } catch (\PDOException $e) {
            return ['status' => 500, 'data' => ['error' => 'Erro ao validar o código.']];
        }

        if ($result === AccountDeletionChallenge::RESULT_MISSING) {
            return ['status' => 400, 'data' => ['error' => 'Não há pedido de eliminação pendente. Peça um novo código.']];
        }
        if ($result === AccountDeletionChallenge::RESULT_EXPIRED) {
            return ['status' => 400, 'data' => ['error' => 'O código expirou. Solicite um novo.']];
        }
        if ($result === AccountDeletionChallenge::RESULT_LOCKED) {
            return ['status' => 400, 'data' => ['error' => 'Código bloqueado após várias tentativas falhadas. Solicite um novo código.']];
        }
        if ($result === AccountDeletionChallenge::RESULT_WRONG) {
            return ['status' => 400, 'data' => ['error' => 'Código incorreto.']];
        }

        try {
            PasswordResetToken::deleteByUserId($uid);
            User::deleteById($uid);
        } catch (\PDOException $e) {
            return ['status' => 500, 'data' => ['error' => 'Erro ao eliminar a conta.']];
        }

        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }

        return ['status' => 200, 'data' => ['success' => true, 'message' => 'Conta eliminada com sucesso.']];
    }

    private static function frontendBaseUrl(array $body = []): string
    {
        $u = getenv('FRONTEND_BASE_URL');
        if (is_string($u) && trim($u) !== '') {
            return rtrim(trim($u), '/');
        }

        $originHeader = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
        if ($originHeader !== '' && filter_var($originHeader, FILTER_VALIDATE_URL)) {
            return rtrim($originHeader, '/');
        }

        $fromClient = trim((string)($body['frontendOrigin'] ?? ''));
        if ($fromClient !== '' && filter_var($fromClient, FILTER_VALIDATE_URL)) {
            if ($originHeader === '' || rtrim($fromClient, '/') === rtrim($originHeader, '/')) {
                return rtrim($fromClient, '/');
            }
        }

        return 'http://localhost:4200';
    }
}
