import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

export interface TherapistRecord {
  id: string;
  givenName: string;
  familyName: string;
  createdAt: Date;
}

const COLUMNS = `id, given_name AS "givenName", family_name AS "familyName", created_at AS "createdAt"`;

export class SchedulingRoster {
  constructor(private readonly dataSource: DataSource) {}

  async list(): Promise<TherapistRecord[]> {
    return this.dataSource.query(
      `SELECT ${COLUMNS}
       FROM scheduling.therapists
       ORDER BY given_name, family_name, id`,
    );
  }

  async findById(id: string): Promise<TherapistRecord | null> {
    const rows: TherapistRecord[] = await this.dataSource.query(
      `SELECT ${COLUMNS} FROM scheduling.therapists WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async insert(givenName: string, familyName: string): Promise<TherapistRecord> {
    const rows = rowsOf<TherapistRecord>(
      await this.dataSource.query(
        `INSERT INTO scheduling.therapists (id, given_name, family_name)
         VALUES ($1, $2, $3)
         RETURNING ${COLUMNS}`,
        [randomUUID(), givenName, familyName],
      ),
    );
    return rows[0];
  }

  async revise(id: string, givenName: string, familyName: string): Promise<TherapistRecord | null> {
    const rows = rowsOf<TherapistRecord>(
      await this.dataSource.query(
        `UPDATE scheduling.therapists
         SET given_name = $2, family_name = $3
         WHERE id = $1
         RETURNING ${COLUMNS}`,
        [id, givenName, familyName],
      ),
    );
    return rows[0] ?? null;
  }

  async remove(id: string): Promise<boolean> {
    const rows = rowsOf<{ id: string }>(
      await this.dataSource.query(`DELETE FROM scheduling.therapists WHERE id = $1 RETURNING id`, [id]),
    );
    return rows.length > 0;
  }
}

function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0] as T[];
  }
  return Array.isArray(result) ? (result as T[]) : [];
}
