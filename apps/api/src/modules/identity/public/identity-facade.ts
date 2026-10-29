import { issueSession, sessionIsValid, sessionUsername } from '../application/session';
import { IdentityError } from '../domain/identity-error';
import { AdminUserRecord, IdentityAccounts } from '../infrastructure/persistence/identity-accounts';
import { passwordMatches, placeholderPasswordHash } from '../infrastructure/password';

const PROTECTED_USERNAME = 'admin';

export interface AdminUserView {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  createdAt: string;
}

export interface SessionProfile {
  username: string;
  administrator: boolean;
}

export class IdentityFacade {
  constructor(private readonly accounts: IdentityAccounts) {}

  async openSession(username: string, password: string): Promise<string | null> {
    const account = await this.accounts.findByUsername(username.trim());
    if (!account || !canEnter(account.role)) {
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
    if (!account || !canEnter(account.role)) {
      return false;
    }
    return sessionIsValid(token, account.username, account.passwordHash);
  }

  async profile(username: string): Promise<SessionProfile> {
    const account = await this.accounts.findByUsername(username);
    if (!account || !canEnter(account.role)) {
      throw new IdentityError('USER_NOT_FOUND', 'No encontramos esa cuenta.');
    }
    return { username: account.username, administrator: account.role === 'admin' };
  }

  async listUsers(): Promise<AdminUserView[]> {
    const users = await this.accounts.list();
    return users.map(toView);
  }

  async registerUser(username: string, password: string, administrator: boolean, actorUsername: string): Promise<AdminUserView> {
    const actor = await this.requireActor(actorUsername);
    if (administrator && actor.role !== 'admin') {
      throw new IdentityError('NOT_AN_ADMINISTRATOR', 'Solo una cuenta administrador puede crear otra cuenta administrador.');
    }
    const role = administrator ? 'admin' : 'staff';
    return toView(await this.accounts.insert(requireUsername(username), requirePassword(password), role));
  }

  async reviseUser(id: string, username: string, password: string | undefined, actorUsername: string): Promise<AdminUserView> {
    await this.requireAdministrator(actorUsername);
    const nextName = requireUsername(username);
    const current = (await this.accounts.list()).find((user) => user.id === id);
    if (!current) {
      throw new IdentityError('USER_NOT_FOUND', 'No encontramos ese usuario.');
    }
    if (isProtectedUsername(current.username) && !isProtectedUsername(nextName)) {
      throw new IdentityError('CANNOT_RENAME_ADMIN', 'No se puede cambiar el usuario admin.');
    }
    const nextPassword = password === undefined || password === '' ? null : requirePassword(password);
    const updated = await this.accounts.revise(id, nextName, nextPassword);
    if (!updated) {
      throw new IdentityError('USER_NOT_FOUND', 'No encontramos ese usuario.');
    }
    return toView(updated);
  }

  async removeUser(id: string, actorUsername: string): Promise<void> {
    await this.requireAdministrator(actorUsername);
    const users = await this.accounts.list();
    const target = users.find((user) => user.id === id);
    if (!target) {
      throw new IdentityError('USER_NOT_FOUND', 'No encontramos ese usuario.');
    }
    if (isProtectedUsername(target.username)) {
      throw new IdentityError('CANNOT_DELETE_ADMIN', 'No se puede eliminar el usuario admin.');
    }
    if (target.username === actorUsername) {
      throw new IdentityError('CANNOT_DELETE_SELF', 'No puedes borrar la cuenta con la que entraste.');
    }
    const administrators = users.filter((user) => user.role === 'admin');
    if (target.role === 'admin' && administrators.length <= 1) {
      throw new IdentityError('LAST_ADMIN', 'Tiene que quedar al menos una cuenta de administración.');
    }
    await this.accounts.remove(id);
  }

  private async requireActor(username: string): Promise<AdminUserRecord> {
    const actor = (await this.accounts.list()).find((user) => user.username === username);
    if (!actor || !canEnter(actor.role)) {
      throw new IdentityError('USER_NOT_FOUND', 'No encontramos la cuenta con la que entraste.');
    }
    return actor;
  }

  private async requireAdministrator(username: string): Promise<void> {
    const actor = await this.requireActor(username);
    if (actor.role !== 'admin') {
      throw new IdentityError('NOT_AN_ADMINISTRATOR', 'Solo una cuenta administrador puede editar o eliminar usuarios.');
    }
  }
}

function toView(user: AdminUserRecord): AdminUserView {
  const created = new Date(user.createdAt);
  return {
    id: user.id,
    username: user.username,
    role: user.role === 'staff' ? 'staff' : 'admin',
    createdAt: Number.isNaN(created.getTime()) ? new Date().toISOString() : created.toISOString(),
  };
}

function canEnter(role: string): boolean {
  return role === 'admin' || role === 'staff';
}

function isProtectedUsername(username: string): boolean {
  return username.trim().toLowerCase() === PROTECTED_USERNAME;
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
