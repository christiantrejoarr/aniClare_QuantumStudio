import { DataSource } from 'typeorm';
import { JournalRecord, SpecialDayRecord } from '../../domain/journal';

interface JournalRow {
  opensMinute: number;
  closesMinute: number;
  sunday: boolean;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  allowWeekends: boolean;
  allowHolidays: boolean;
  allowHalfDays: boolean;
}

interface SpecialRow {
  day: string;
  kind: 'holiday' | 'half_day';
  opensMinute: number | null;
  closesMinute: number | null;
}

const JOURNAL_COLUMNS = `
  opens_minute AS "opensMinute",
  closes_minute AS "closesMinute",
  sunday, monday, tuesday, wednesday, thursday, friday, saturday,
  allow_weekends AS "allowWeekends",
  allow_holidays AS "allowHolidays",
  allow_half_days AS "allowHalfDays"
`;

export class SchedulingJournal {
  constructor(private readonly dataSource: DataSource) {}

  async read(): Promise<{ journal: JournalRecord; specials: SpecialDayRecord[] }> {
    const journalRows = rowsOf<JournalRow>(
      await this.dataSource.query(`SELECT ${JOURNAL_COLUMNS} FROM scheduling.journal WHERE id = true`),
    );
    const specials = rowsOf<SpecialRow>(
      await this.dataSource.query(
        `SELECT day::text AS day, kind, opens_minute AS "opensMinute", closes_minute AS "closesMinute"
         FROM scheduling.special_days
         ORDER BY day`,
      ),
    );
    const row = journalRows[0];
    return {
      journal: row
        ? {
            opensMinute: row.opensMinute,
            closesMinute: row.closesMinute,
            openDays: [row.sunday, row.monday, row.tuesday, row.wednesday, row.thursday, row.friday, row.saturday],
            allowWeekends: row.allowWeekends,
            allowHolidays: row.allowHolidays,
            allowHalfDays: row.allowHalfDays,
          }
        : {
            opensMinute: 600,
            closesMinute: 1140,
            openDays: [false, true, true, true, true, true, false],
            allowWeekends: false,
            allowHolidays: false,
            allowHalfDays: false,
          },
      specials,
    };
  }

  async save(journal: JournalRecord): Promise<void> {
    const days = journal.openDays;
    await this.dataSource.query(
      `UPDATE scheduling.journal
       SET opens_minute = $1,
           closes_minute = $2,
           sunday = $3,
           monday = $4,
           tuesday = $5,
           wednesday = $6,
           thursday = $7,
           friday = $8,
           saturday = $9,
           allow_weekends = $10,
           allow_holidays = $11,
           allow_half_days = $12
       WHERE id = true`,
      [
        journal.opensMinute,
        journal.closesMinute,
        days[0],
        days[1],
        days[2],
        days[3],
        days[4],
        days[5],
        days[6],
        journal.allowWeekends,
        journal.allowHolidays,
        journal.allowHalfDays,
      ],
    );
  }

  async addSpecial(day: SpecialDayRecord): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO scheduling.special_days (day, kind, opens_minute, closes_minute)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (day) DO UPDATE
       SET kind = EXCLUDED.kind,
           opens_minute = EXCLUDED.opens_minute,
           closes_minute = EXCLUDED.closes_minute`,
      [day.day, day.kind, day.opensMinute, day.closesMinute],
    );
  }

  async removeSpecial(day: string): Promise<boolean> {
    const rows = rowsOf<{ day: string }>(
      await this.dataSource.query(`DELETE FROM scheduling.special_days WHERE day = $1 RETURNING day::text AS day`, [day]),
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
