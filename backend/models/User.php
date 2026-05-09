<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

final class User
{
    public static function findByEmail(string $email): ?array
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id, name, email, password_hash FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function findById(int $id): ?array
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id, name, email, created_at FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function create(string $name, string $email, string $password): int
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (:name, :email, :hash)');
        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'hash' => password_hash($password, PASSWORD_DEFAULT),
        ]);
        return (int)$pdo->lastInsertId();
    }

    public static function emailExistsForAnotherUser(string $email, int $userId): bool
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email AND id <> :id LIMIT 1');
        $stmt->execute(['email' => $email, 'id' => $userId]);
        return (bool)$stmt->fetch();
    }

    public static function updateProfile(int $id, string $name, string $email, ?string $password = null): void
    {
        $pdo = Database::pdo();

        if ($password !== null && $password !== '') {
            $stmt = $pdo->prepare(
                'UPDATE users SET name = :name, email = :email, password_hash = :hash WHERE id = :id'
            );
            $stmt->execute([
                'name' => $name,
                'email' => $email,
                'hash' => password_hash($password, PASSWORD_DEFAULT),
                'id' => $id,
            ]);
            return;
        }

        $stmt = $pdo->prepare('UPDATE users SET name = :name, email = :email WHERE id = :id');
        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'id' => $id,
        ]);
    }
}
