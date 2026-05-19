<?php

declare(strict_types=1);

final class MailService
{
    /**
     * Quando MAIL_LOG_ONLY não está definido, assume-se modo ficheiro (XAMPP/PHP mail() raramente envia).
     * Para tentar envio real: MAIL_LOG_ONLY=0 no .env e configure sendmail/SMTP no SO.
     */
    public static function shouldLogOnly(): bool
    {
        $v = getenv('MAIL_LOG_ONLY');
        if ($v === false || $v === null || trim((string)$v) === '') {
            return true;
        }

        $v = strtolower(trim((string)$v));
        if ($v === '0' || $v === 'false' || $v === 'no') {
            return false;
        }

        return $v === '1' || $v === 'true' || $v === 'yes';
    }

    public static function sendPlain(string $to, string $subject, string $body): bool
    {
        $to = trim($to);
        if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            error_log('[MailService] sendPlain: destinatário inválido ou vazio');
            return false;
        }

        $logOnly = self::shouldLogOnly();

        if ($logOnly) {
            $written = self::appendMailLog($to, $subject, $body, '[LOG_ONLY] ');
            if ($written) {
                error_log("[MailService] Email registado em storage/mail.log (MAIL_LOG_ONLY) para {$to}");
            } else {
                error_log("[MailService] ERRO: não foi possível escrever storage/mail.log (verifique permissões da pasta backend/storage)");
            }

            return $written;
        }

        $from = getenv('MAIL_FROM') ?: 'noreply@localhost';
        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "From: {$from}\r\n";

        $sent = @mail($to, $encodedSubject, $body, $headers);
        if ($sent) {
            error_log("[MailService] php mail() aceitou envio para {$to}");
        } else {
            error_log("[MailService] php mail() FALHOU para {$to} — verifique sendmail/postfix ou use MAIL_LOG_ONLY=1");
            self::appendMailLog($to, $subject, $body, '[MAIL_FAILED_FALLBACK] ');
        }

        return $sent;
    }

    private static function appendMailLog(string $to, string $subject, string $body, string $prefix = ''): bool
    {
        $dir = __DIR__ . '/../storage';
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        if (!is_dir($dir) || !is_writable($dir)) {
            return false;
        }

        $path = $dir . '/mail.log';
        $line = sprintf(
            "%s[%s]\nTO: %s\nSUBJECT: %s\n%s\n---\n",
            $prefix,
            date('c'),
            $to,
            $subject,
            $body
        );

        return @file_put_contents($path, $line, FILE_APPEND) !== false;
    }
}
