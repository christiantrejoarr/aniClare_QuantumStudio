CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE IF NOT EXISTS identity.users (
  id uuid PRIMARY KEY,
  username text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT identity_users_username_unique UNIQUE (username),
  CHECK (char_length(trim(username)) BETWEEN 1 AND 80),
  CHECK (role IN ('admin', 'staff'))
);
