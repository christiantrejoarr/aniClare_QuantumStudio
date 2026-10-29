import { issueSession, sessionIsValid } from './session';

describe('admin session', () => {
  const now = Date.parse('2026-10-28T18:00:00.000Z');

  it('emite una sesión que caduca y deja de valer si cambia el secreto', () => {
    const token = issueSession('admin', 'hash-de-la-contraseña', now);

    expect(sessionIsValid(token, 'admin', 'hash-de-la-contraseña', now + 1000)).toBe(true);
    expect(sessionIsValid(token, 'admin', 'hash-de-la-contraseña', now + 13 * 60 * 60 * 1000)).toBe(false);
    expect(sessionIsValid(token, 'admin', 'otro-hash', now + 1000)).toBe(false);
    expect(sessionIsValid(`${token}x`, 'admin', 'hash-de-la-contraseña', now + 1000)).toBe(false);
  });
});
