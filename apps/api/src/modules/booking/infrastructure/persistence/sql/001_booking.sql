-- Schema booking. Sin llaves foráneas hacia otros contextos:
-- cliente, servicio y terapeuta se referencian por id.
-- El anticipo guarda monto y estado, nunca datos de tarjeta.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS booking.reservations (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL,
  service_id uuid NOT NULL,
  therapist_id uuid NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'expired')),
  deposit_amount_cents integer NOT NULL CHECK (deposit_amount_cents >= 0),
  deposit_currency char(3) NOT NULL,
  deposit_status text NOT NULL CHECK (deposit_status IN ('pending', 'paid', 'waived', 'refund_due', 'forfeited')),
  cancellation_notice_hours integer NOT NULL CHECK (cancellation_notice_hours >= 0),
  cancellation_late_refund_percent integer NOT NULL CHECK (cancellation_late_refund_percent BETWEEN 0 AND 100),
  payment_reference text NULL,
  hold_expires_at timestamptz NULL,
  cancelled_at timestamptz NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS reservations_customer_starts_idx
  ON booking.reservations (customer_id, starts_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reservations_no_therapist_overlap'
  ) THEN
    ALTER TABLE booking.reservations
      ADD CONSTRAINT reservations_no_therapist_overlap
      EXCLUDE USING gist (
        therapist_id WITH =,
        tstzrange(starts_at, ends_at, '[)') WITH &&
      )
      WHERE (status IN ('pending_payment', 'confirmed'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS booking.waitlist_entries (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL,
  service_id uuid NOT NULL,
  therapist_id uuid NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('waiting', 'notified', 'cancelled')),
  created_at timestamptz NOT NULL,
  notified_at timestamptz NULL,
  CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_one_active_entry
  ON booking.waitlist_entries (customer_id, therapist_id, starts_at)
  WHERE status = 'waiting';

CREATE INDEX IF NOT EXISTS waitlist_next_idx
  ON booking.waitlist_entries (therapist_id, created_at)
  WHERE status = 'waiting';
