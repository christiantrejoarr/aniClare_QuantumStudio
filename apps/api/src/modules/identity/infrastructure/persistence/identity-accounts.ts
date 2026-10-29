import { randomUUID } from 'crypto';
import { DataSource, QueryFailedError } from 'typeorm';
import { IdentityError } from '../../domain/identity-error';
import { hashPassword } from '../password';

export interface AdminAccount {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
}

export interface AdminUserRecord {
  id: string;
  username: string;
  role: string;
  createdAt: Date;
}

const USER_COLUMNS = `id, username, password_hash AS "passwordHash", role, created_at AS "createdAt"`;

export class IdentityAccounts {
  constructor(private readonly dataSource: DataSource) {}

  async findByUsername(username: string): Promise<AdminAccount | null> {
    const rows: AdminAccount[] = await this.dataSource.query(
      `SELECT ${USER_COLUMNS} FROM identity.users WHERE username = $1`,
      [username],
    );
    return rows[0] ?? null;
  }

  async list(): Promise<AdminUserRecord[]> {
    return this.dataSource.query(
      `SELECT id, username, role, created_at AS "createdAt"
       FROM identity.users
       ORDER BY username`,
    );
  }

  async ensureAdmin(username: string, password: string): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO identity.users (id, username, password_hash, role, created_at)
       VALUES ($1, $2, $3, 'admin', now())
       ON CONFLICT (username) DO NOTHING`,
      [randomUUID(), username.trim(), await hashPassword(password)],
    );
  }

  async insert(username: string, password: string, role: 'admin' | 'staff'): Promise<AdminUserRecord> {
    try {
      const rows = rowsOf<AdminUserRecord>(
        await this.dataSource.query(
          `INSERT INTO identity.users (id, username, password_hash, role, created_at)
           VALUES ($1, $2, $3, $4, now())
           RETURNING id, username, role, created_at AS "createdAt"`,
          [randomUUID(), username, await hashPassword(password), role],
        ),
      );
      return rows[0];
    } catch (error) {
      throw mapUnique(error);
    }
  }

  async revise(id: string, username: string, password: string | null): Promise<AdminUserRecord | null> {
    try {
      const rows = rowsOf<AdminUserRecord>(
        await this.dataSource.query(
          `UPDATE identity.users
           SET username = $2,
               password_hash = COALESCE($3, password_hash)
           WHERE id = $1
           RETURNING id, username, role, created_at AS "createdAt"`,
          [id, username, password ? await hashPassword(password) : null],
        ),
      );
      return rows[0] ?? null;
    } catch (error) {
      throw mapUnique(error);
    }
  }

  async remove(id: string): Promise<boolean> {
    const rows = rowsOf<{ id: string }>(
      await this.dataSource.query(`DELETE FROM identity.users WHERE id = $1 RETURNING id`, [id]),
    );
    return rows.length > 0;
  }
}

function mapUnique(error: unknown): unknown {
  if (error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23505') {
    return new IdentityError('USERNAME_TAKEN', 'Ese usuario ya existe.');
  }
  return error;
}

function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0] as T[];
  }
  return Array.isArray(result) ? (result as T[]) : [];
}
