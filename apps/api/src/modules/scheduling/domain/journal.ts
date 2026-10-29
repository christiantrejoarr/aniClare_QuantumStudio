export const SPA_OFFSET_HOURS = 6;

export interface JournalRecord {
  opensMinute: number;
  closesMinute: number;
  openDays: boolean[];
  allowWeekends: boolean;
  allowHolidays: boolean;
  allowHalfDays: boolean;
}

export interface SpecialDayRecord {
  day: string;
  kind: 'holiday' | 'half_day';
  opensMinute: number | null;
  closesMinute: number | null;
}

export interface DayWindow {
  date: string;
  opensMinute: number;
  closesMinute: number;
}

export interface TakenSpan {
  startsAt: Date;
  endsAt: Date;
}

export function spaDay(instant: Date): { day: string; weekday: number; minute: number } {
  const local = new Date(instant.getTime() - SPA_OFFSET_HOURS * 3_600_000);
  return {
    day: local.toISOString().slice(0, 10),
    weekday: local.getUTCDay(),
    minute: local.getUTCHours() * 60 + local.getUTCMinutes(),
  };
}

export function atSpaTime(day: string, minute: number): Date {
  const [year, month, date] = day.split('-').map(Number);
  const hour = Math.floor(minute / 60);
  const min = minute % 60;
  return new Date(Date.UTC(year, month - 1, date, hour + SPA_OFFSET_HOURS, min));
}

export function formatMinute(minute: number): string {
  const hour = Math.floor(minute / 60);
  const min = minute % 60;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function parseMinute(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function windowFor(journal: JournalRecord, specials: SpecialDayRecord[], day: string, weekday: number): DayWindow | null {
  const special = specials.find((item) => item.day === day);
  if (special?.kind === 'half_day') {
    if (!journal.allowHalfDays || !weekdayOpen(journal, weekday) || special.opensMinute === null || special.closesMinute === null) {
      return null;
    }
    return { date: day, opensMinute: special.opensMinute, closesMinute: special.closesMinute };
  }
  if (special?.kind === 'holiday' && !journal.allowHolidays) {
    return null;
  }
  if (!weekdayOpen(journal, weekday)) {
    return null;
  }
  return { date: day, opensMinute: journal.opensMinute, closesMinute: journal.closesMinute };
}

export function slotFits(journal: JournalRecord, specials: SpecialDayRecord[], startsAt: Date, endsAt: Date): boolean {
  const start = spaDay(startsAt);
  const end = spaDay(new Date(endsAt.getTime() - 1));
  if (start.day !== end.day) {
    return false;
  }
  const window = windowFor(journal, specials, start.day, start.weekday);
  if (!window) {
    return false;
  }
  const endMinute = spaDay(endsAt).day === start.day ? spaDay(endsAt).minute : 24 * 60;
  return start.minute >= window.opensMinute && endMinute <= window.closesMinute;
}

export function openStarts(window: DayWindow, durationMinutes: number, taken: TakenSpan[], now: Date): string[] {
  const hours: string[] = [];
  for (let minute = window.opensMinute; minute + durationMinutes <= window.closesMinute; minute += 1) {
    const startsAt = atSpaTime(window.date, minute);
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
    if (startsAt <= now) {
      continue;
    }
    const busy = taken.some((span) => startsAt < span.endsAt && span.startsAt < endsAt);
    if (!busy) {
      hours.push(formatMinute(minute));
    }
  }
  return hours;
}

export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  let cursor = from;
  while (cursor <= to && days.length <= 62) {
    days.push(cursor);
    cursor = shiftDay(cursor, 1);
  }
  return days;
}

export function shiftDay(day: string, amount: number): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date + amount)).toISOString().slice(0, 10);
}

function weekdayOpen(journal: JournalRecord, weekday: number): boolean {
  if ((weekday === 0 || weekday === 6) && !journal.allowWeekends) {
    return false;
  }
  return journal.openDays[weekday] === true;
}
