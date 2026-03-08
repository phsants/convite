-- Lista de presentes na festa (exibir no link de confirmação)
ALTER TABLE parties ADD COLUMN IF NOT EXISTS gift_list TEXT;
