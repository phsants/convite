-- ============================================================
-- Sistema de login e dono das festas
-- Execute no seu banco (ex: flyracorp_db) na ordem abaixo.
-- ============================================================

-- 1) Extensão para UUID (se ainda não tiver)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Tabela de usuários (login manual no banco; sem cadastro pela app)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 3) Vincular festas a um dono (usuário)
ALTER TABLE parties
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_parties_user_id ON parties(user_id);

-- 4) Depois de criar o primeiro usuário (via script Node ou INSERT manual),
--    opcional: atribuir festas antigas a esse usuário:
--
--    UPDATE parties
--    SET user_id = (SELECT id FROM users WHERE is_admin = true LIMIT 1)
--    WHERE user_id IS NULL;
