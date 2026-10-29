ALTER TABLE identity.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE identity.users DROP CONSTRAINT IF EXISTS identity_users_role_check;
ALTER TABLE identity.users
  ADD CONSTRAINT identity_users_role_check CHECK (role IN ('admin', 'staff'));
