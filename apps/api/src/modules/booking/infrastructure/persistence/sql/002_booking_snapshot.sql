ALTER TABLE booking.reservations ADD COLUMN IF NOT EXISTS service_name text;
ALTER TABLE booking.reservations ADD COLUMN IF NOT EXISTS price_cents integer;

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'booking'
      AND rel.relname = 'reservations'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ~ '(^|[^a-z_])status([^a-z_]|$)'
  LOOP
    EXECUTE format('ALTER TABLE booking.reservations DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE booking.reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'expired', 'attended'));
