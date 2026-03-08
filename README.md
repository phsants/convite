# Convite — Festa de Aniversário

App de convites com confirmação de presença. Frontend em React (Vite) e API em Node.js com PostgreSQL.

## Desenvolvimento local

1. Clone o repositório e entre na pasta.
2. Instale dependências: `npm install`
3. **API (PostgreSQL):** crie um banco e defina `DATABASE_URL` em `server/.env` (veja `server/.env.example`).
4. Suba o banco e rode a API:
   - `cd server && npm install && npm run dev` (API em http://localhost:3000)
5. **Frontend:** em outro terminal, `VITE_API_URL=http://localhost:3000 npm run dev` (Vite em http://localhost:5173).

## Deploy com Docker (EasyPanel / Hostinger VPS)

1. **PostgreSQL:** crie um banco (Hostinger ou EasyPanel) e anote a connection string.
2. **Build da imagem:** na raiz do projeto, `docker build -t convite .`
3. **Rodar o container:** passe `DATABASE_URL` e, se quiser, `PORT`:
   - `docker run -p 3000:3000 -e DATABASE_URL=postgresql://user:pass@host:5432/db convite`
4. **EasyPanel:** crie um app Docker usando este repositório (Dockerfile na raiz). Adicione o serviço PostgreSQL e defina a variável de ambiente `DATABASE_URL` com a URL do banco. A API e o frontend rodam juntos na mesma porta (ex.: 3000).
