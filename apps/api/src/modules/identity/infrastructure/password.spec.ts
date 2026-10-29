import { hashPassword, passwordMatches } from './password';

describe('password', () => {
  it('guarda la contraseña cifrada y solo acepta la original', async () => {
    const stored = await hashPassword('secreta');

    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(stored).not.toContain('secreta');
    expect(await passwordMatches('secreta', stored)).toBe(true);
    expect(await passwordMatches('otra', stored)).toBe(false);
  });
});
