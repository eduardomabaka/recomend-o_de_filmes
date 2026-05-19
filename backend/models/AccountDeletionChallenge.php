<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

final class AccountDeletionChallenge
{
    public const RESULT_OK = 'ok';
    public const RESULT_MISSING = 'missing';
    public const RESULT_EXPIRED = 'expired';
    public const RESULT_LOCKED = 'locked';
    public const RESULT_WRONG = 'wrong';

    /** Gera e guarda código de 6 dígitos; devolve o código em texto claro (para enviar por email). */
    public static function issue(int $userId): string
    {
        $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $hash = password_hash($code, PASSWORD_DEFAULT);

        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'INSERT INTO account_deletion_challenges (user_id, code_hash, expires_at, attempts)
             VALUES (:uid, :hash, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0)
             ON DUPLICATE KEY UPDATE code_hash = VALUES(code_hash), expires_at = VALUES(expires_at), attempts = 0'
        );
        $stmt->execute(['uid' => $userId, 'hash' => $hash]);

        return $code;
    }

    /** @return self::RESULT_* */
    public static function verify(int $userId, string $code): string
    {
        $code = trim($code);
        if ($code === '' || strlen($code) > 10) {
            return self::RESULT_WRONG;
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'SELECT code_hash, expires_at, attempts FROM account_deletion_challenges WHERE user_id = :uid LIMIT 1'
        );
        $stmt->execute(['uid' => $userId]);
        $row = $stmt->fetch();
        if (!$row) {
            return self::RESULT_MISSING;
        }

        $expires = strtotime((string)$row['expires_at']) ?: 0;
        if ($expires < time()) {
            $pdo->prepare('DELETE FROM account_deletion_challenges WHERE user_id = :uid')->execute(['uid' => $userId]);
            return self::RESULT_EXPIRED;
        }

        $attempts = (int)$row['attempts'];
        if ($attempts >= 3) {
            $pdo->prepare('DELETE FROM account_deletion_challenges WHERE user_id = :uid')->execute(['uid' => $userId]);
            return self::RESULT_LOCKED;
        }

        if (!password_verify($code, (string)$row['code_hash'])) {
            $attempts++;
            if ($attempts >= 3) {
                $pdo->prepare('DELETE FROM account_deletion_challenges WHERE user_id = :uid')->execute(['uid' => $userId]);
                return self::RESULT_LOCKED;
            }
            $pdo->prepare(
                'UPDATE account_deletion_challenges SET attempts = :a WHERE user_id = :uid'
            )->execute(['a' => $attempts, 'uid' => $userId]);
            return self::RESULT_WRONG;
        }

        $pdo->prepare('DELETE FROM account_deletion_challenges WHERE user_id = :uid')->execute(['uid' => $userId]);
        return self::RESULT_OK;
    }
}
