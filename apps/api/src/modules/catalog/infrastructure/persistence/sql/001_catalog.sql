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

INSERT INTO catalog.services (
  id, name, description, duration_minutes, price_cents, deposit_cents, currency, active, created_at, updated_at
) VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'Masaje relajante',
    'Sesión para soltar tensión de espalda, cuello y hombros.',
    60, 85000, 30000, 'MXN', true, TIMESTAMPTZ '2026-10-27T18:00:00Z', TIMESTAMPTZ '2026-10-27T18:00:00Z'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Facial hidratante',
    'Limpieza e hidratación para dejar la piel luminosa.',
    50, 70000, 25000, 'MXN', true, TIMESTAMPTZ '2026-10-27T18:00:00Z', TIMESTAMPTZ '2026-10-27T18:00:00Z'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Ritual corporal',
    'Exfoliación, envoltura y masaje en un mismo ritual.',
    90, 120000, 40000, 'MXN', true, TIMESTAMPTZ '2026-10-27T18:00:00Z', TIMESTAMPTZ '2026-10-27T18:00:00Z'
  )
ON CONFLICT (id) DO NOTHING;
