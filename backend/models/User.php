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
        $stmt = $pdo->prepare(
            'SELECT id, name, email, favorite_genre_id, worst_genre_id, quiz_answer_2, quiz_answer_3, created_at
             FROM users WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /** @return array{favorite_genre_id: ?int, worst_genre_id: ?int}|null */
    public static function findGenrePrefsById(int $id): ?array
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'SELECT favorite_genre_id, worst_genre_id FROM users WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        return [
            'favorite_genre_id' => $row['favorite_genre_id'] !== null ? (int)$row['favorite_genre_id'] : null,
            'worst_genre_id' => $row['worst_genre_id'] !== null ? (int)$row['worst_genre_id'] : null,
        ];
    }

    /** @param array{favorite_genre_id?: mixed, worst_genre_id?: mixed, quiz_answer_2?: mixed, quiz_answer_3?: mixed}|null $quiz */
    public static function create(string $name, string $email, string $password, ?array $quiz = null): int
    {
        $pdo = Database::pdo();
        $favGenre = isset($quiz['favorite_genre_id']) ? max(0, (int)$quiz['favorite_genre_id']) : null;
        $worstGenre = isset($quiz['worst_genre_id']) ? max(0, (int)$quiz['worst_genre_id']) : null;
        $q2 = isset($quiz['quiz_answer_2']) ? substr(trim((string)$quiz['quiz_answer_2']), 0, 160) : null;
        $q3 = isset($quiz['quiz_answer_3']) ? substr(trim((string)$quiz['quiz_answer_3']), 0, 160) : null;

        if ($favGenre !== null && $favGenre <= 0) {
            $favGenre = null;
        }
        if ($worstGenre !== null && $worstGenre <= 0) {
            $worstGenre = null;
        }
        if ($q2 !== null && $q2 === '') {
            $q2 = null;
        }
        if ($q3 !== null && $q3 === '') {
            $q3 = null;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO users (name, email, password_hash, favorite_genre_id, worst_genre_id, quiz_answer_2, quiz_answer_3)
             VALUES (:name, :email, :hash, :fav_genre, :worst_genre, :q2, :q3)'
        );
        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'hash' => password_hash($password, PASSWORD_DEFAULT),
            'fav_genre' => $favGenre,
            'worst_genre' => $worstGenre,
            'q2' => $q2,
            'q3' => $q3,
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
