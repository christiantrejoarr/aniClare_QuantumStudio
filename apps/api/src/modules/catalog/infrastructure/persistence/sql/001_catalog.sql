CREATE SCHEMA IF NOT EXISTS catalog;

CREATE TABLE IF NOT EXISTS catalog.services (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  deposit_cents integer NOT NULL CHECK (deposit_cents >= 0),
  currency char(3) NOT NULL,
  active boolean NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (char_length(trim(name)) BETWEEN 2 AND 80),
  CHECK (price_cents >= deposit_cents)
);
