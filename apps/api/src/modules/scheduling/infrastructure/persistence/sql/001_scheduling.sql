CREATE SCHEMA IF NOT EXISTS scheduling;

CREATE TABLE IF NOT EXISTS scheduling.therapists (
  id uuid PRIMARY KEY,
  given_name text NOT NULL,
  family_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (char_length(trim(given_name)) BETWEEN 1 AND 40),
  CHECK (char_length(family_name) <= 40)
);

INSERT INTO scheduling.therapists (id, given_name, family_name)
VALUES
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Ana', ''),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Lucía', '')
ON CONFLICT (id) DO NOTHING;
