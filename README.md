# Sistema de Recomendação de Filmes

Estrutura base do projeto:

- `backend/`: API REST em PHP (puro) usando PDO + MySQL
- `frontend/`: estrutura do Angular (pasta `src/` organizada)
- `database/schema.sql`: script SQL com as tabelas obrigatórias

## Requisitos

- PHP 8+ (XAMPP/LAMPP)
- MySQL/MariaDB

## Backend (rápido)

1. Configure o acesso ao banco em `backend/config/database.php`.
2. Aponte o DocumentRoot/VirtualHost do Apache para `backend/public/` (ou acesse diretamente essa pasta).
3. (Opcional) Defina variáveis de ambiente:
   - `TMDB_API_KEY` (para integração com TMDB)

## Banco de dados

Execute o script `database/schema.sql` no seu MySQL.

