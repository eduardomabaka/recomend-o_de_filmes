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
3. Configure a chave do TMDB em `backend/.env`:

   ```env
   TMDB_API_KEY=sua_chave_tmdb
   TMDB_READ_ACCESS_TOKEN=seu_read_access_token_tmdb
   ```

   Pode usar apenas um dos dois, mas o ideal é manter pelo menos o token de leitura.  
   Use `backend/.env.example` como referência.

## Banco de dados

Execute o script `database/schema.sql` no seu MySQL.

