<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

final class PasswordResetToken
{
    public static function createForUser(int $userId): string
    {
        $raw = bin2hex(random_bytes(32));
        $hash = hash('sha256', $raw);

        $pdo = Database::pdo();
        $pdo->prepare('DELETE FROM password_reset_tokens WHERE user_id = :uid')->execute(['uid' => $userId]);
        $stmt = $pdo->prepare(
            'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
             VALUES (:uid, :hash, DATE_ADD(NOW(), INTERVAL 1 HOUR))'
        );
        $stmt->execute(['uid' => $userId, 'hash' => $hash]);

        return $raw;
    }

    /** @return positive-int|null user id if token is valid */
    public static function findValidUserId(string $rawToken): ?int
    {
        $rawToken = trim($rawToken);
        if ($rawToken === '') {
            return null;
        }

        $hash = hash('sha256', $rawToken);
        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'SELECT user_id FROM password_reset_tokens
             WHERE token_hash = :hash AND expires_at > NOW()
             LIMIT 1'
        );
        $stmt->execute(['hash' => $hash]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        return (int)$row['user_id'];
    }

    public static function deleteByUserId(int $userId): void
    {
        $pdo = Database::pdo();
        $pdo->prepare('DELETE FROM password_reset_tokens WHERE user_id = :uid')->execute(['uid' => $userId]);
    }

    public static function deleteByRawToken(string $rawToken): void
    {
        $hash = hash('sha256', trim($rawToken));
        $pdo = Database::pdo();
        $pdo->prepare('DELETE FROM password_reset_tokens WHERE token_hash = :hash')->execute(['hash' => $hash]);
    }
}
