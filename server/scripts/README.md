# Scripts do banco e criação de usuários

## 1. Migração de login e donos das festas

Execute no seu banco (ex.: `flyracorp_db`) o conteúdo de:

- **`001-auth-and-owners.sql`**

Isso cria a tabela `users` e a coluna `parties.user_id`.

## 2. Lista de presentes no convite

Execute no banco o conteúdo de:

- **`002-gift-list.sql`**

Isso adiciona a coluna `parties.gift_list` (lista de presentes exibida no link de confirmação).

## 3. Criar usuários (manual)

Não há tela de cadastro na aplicação. Usuários são criados pelo script:

A partir da pasta **`server`**:

```bash
cd server
node scripts/create-user.js <username> <password> [is_admin]
```

Exemplos:

```bash
# Admin (acesso ao painel de todas as festas)
node scripts/create-user.js admin senha123 true

# Usuário comum (só vê as próprias festas)
node scripts/create-user.js maria senha456 false
```

Requisitos: arquivo `server/.env` com `DATABASE_URL` definida.

Em produção, defina também no `server/.env`:

- `JWT_SECRET` — string secreta para assinar o token (ex.: uma chave longa e aleatória). Se não for definida, será usada um valor padrão (menos seguro).

## 4. Atribuir festas antigas a um usuário (opcional)

Se você já tinha festas antes de rodar a migração, elas ficam com `user_id` nulo. Para atribuir todas a um admin:

```sql
UPDATE parties
SET user_id = (SELECT id FROM users WHERE is_admin = true LIMIT 1)
WHERE user_id IS NULL;
```

Depois disso, esse admin verá todas as festas no painel e na listagem.
