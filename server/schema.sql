CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name TEXT NOT NULL,
  party_date DATE NOT NULL,
  party_time TEXT,
  party_location TEXT,
  party_theme TEXT,
  child_age INT,
  photos JSONB DEFAULT '[]',
  message TEXT,
  gift_list TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'adult' CHECK (type IN ('adult', 'child')),
  age INT,
  group_name TEXT,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  confirmation_token TEXT NOT NULL UNIQUE,
  confirmed_status TEXT DEFAULT 'pending' CHECK (confirmed_status IN ('pending', 'confirmed', 'declined')),
  response_date TIMESTAMPTZ,
  message TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guests_party_id ON guests(party_id);
CREATE INDEX IF NOT EXISTS idx_guests_confirmation_token ON guests(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_parties_created_date ON parties(created_date DESC);
