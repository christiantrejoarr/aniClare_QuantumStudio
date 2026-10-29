import { issueSession, sessionIsValid, sessionUsername } from '../application/session';
import { IdentityError } from '../domain/identity-error';
import { AdminUserRecord, IdentityAccounts } from '../infrastructure/persistence/identity-accounts';
import { passwordMatches, placeholderPasswordHash } from '../infrastructure/password';

export interface AdminUserView {
  id: string;
  username: string;
  role: 'admin';
  createdAt: string;
}

export class IdentityFacade {
  constructor(private readonly accounts: IdentityAccounts) {}

  async openSession(username: string, password: string): Promise<string | null> {
    const account = await this.accounts.findByUsername(username.trim());
    if (!account || account.role !== 'admin') {
      await passwordMatches(password, await placeholderPasswordHash());
      return null;
    }
    if (!(await passwordMatches(password, account.passwordHash))) {
      return null;
    }
    return issueSession(account.username, account.passwordHash);
  }

  async sessionIsValid(token: string): Promise<boolean> {
    const username = sessionUsername(token);
    if (!username) {
      return false;
    }
    const account = await this.accounts.findByUsername(username);
    if (!account || account.role !== 'admin') {
      return false;
    }
    return sessionIsValid(token, account.username, account.passwordHash);
  }

  async listUsers(): Promise<AdminUserView[]> {
    const users = await this.accounts.list();
    return users.map(toView);
  }

  async registerUser(username: string, password: string): Promise<AdminUserView> {
    return toView(await this.accounts.insert(requireUsername(username), requirePassword(password)));
  }

  async reviseUser(id: string, username: string, password?: string): Promise<AdminUserView> {
    const nextPassword = password === undefined || password === '' ? null : requirePassword(password);
    const updated = await this.accounts.revise(id, requireUsername(username), nextPassword);
    if (!updated) {
      throw new IdentityError('USER_NOT_FOUND', 'No encontramos ese usuario.');
    }
    return toView(updated);
  }

  async removeUser(id: string, actorUsername: string): Promise<void> {
    const users = await this.accounts.list();
    const target = users.find((user) => user.id === id);
    if (!target) {
      throw new IdentityError('USER_NOT_FOUND', 'No encontramos ese usuario.');
    }
    if (target.username === actorUsername) {
      throw new IdentityError('CANNOT_DELETE_SELF', 'No puedes borrar la cuenta con la que entraste.');
    }
    if (users.length <= 1) {
      throw new IdentityError('LAST_ADMIN', 'Tiene que quedar al menos una cuenta de administración.');
    }
    await this.accounts.remove(id);
  }
}

function toView(user: AdminUserRecord): AdminUserView {
  const created = new Date(user.createdAt);
  return {
    id: user.id,
    username: user.username,
    role: 'admin',
    createdAt: Number.isNaN(created.getTime()) ? new Date().toISOString() : created.toISOString(),
  };
}

function requireUsername(username: string): string {
  const trimmed = username.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    throw new IdentityError('INVALID_USER', 'El usuario debe tener entre 2 y 80 caracteres.');
  }
  return trimmed;
}

function requirePassword(password: string): string {
  if (password.length < 8 || password.length > 200) {
    throw new IdentityError('INVALID_USER', 'La contraseña debe tener al menos 8 caracteres.');
  }
  return password;
}
