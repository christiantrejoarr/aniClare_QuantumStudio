import {
  DayWindow,
  eachDay,
  formatMinute,
  JournalRecord,
  parseMinute,
  slotFits,
  spaDay,
  SpecialDayRecord,
  windowFor,
} from '../domain/journal';
import { SchedulingError } from '../domain/scheduling-error';
import { SchedulingJournal } from '../infrastructure/persistence/scheduling-journal';
import { SchedulingRoster, TherapistRecord } from '../infrastructure/persistence/scheduling-roster';

export interface TherapistView {
  id: string;
  givenName: string;
  familyName: string;
  name: string;
}

export interface WorkingHoursView {
  opensAt: string;
  closesAt: string;
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
  days: Array<{
    day: string;
    kind: 'holiday' | 'half_day';
    opensAt: string | null;
    closesAt: string | null;
  }>;
}

export interface WorkingHoursCommand {
  opensAt: string;
  closesAt: string;
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

export interface SpecialDayCommand {
  day: string;
  kind: 'holiday' | 'half_day';
  opensAt?: string;
  closesAt?: string;
}

export class SchedulingFacade {
  constructor(
    private readonly roster: SchedulingRoster,
    private readonly journal: SchedulingJournal,
  ) {}

  async list(): Promise<TherapistView[]> {
    const therapists = await this.roster.list();
    return therapists.map(toView);
  }

  async isBookable(id: string): Promise<boolean> {
    return (await this.roster.findById(id)) !== null;
  }

  async register(givenName: string, familyName: string): Promise<TherapistView> {
    return toView(await this.roster.insert(requireName(givenName, 'nombre'), requireName(familyName, 'apellido')));
  }

  async revise(id: string, givenName: string, familyName: string): Promise<TherapistView> {
    const updated = await this.roster.revise(id, requireName(givenName, 'nombre'), requireName(familyName, 'apellido'));
    if (!updated) {
      throw new SchedulingError('THERAPIST_NOT_FOUND', 'No encontramos a esa terapeuta.');
    }
    return toView(updated);
  }

  async remove(id: string): Promise<void> {
    const removed = await this.roster.remove(id);
    if (!removed) {
      throw new SchedulingError('THERAPIST_NOT_FOUND', 'No encontramos a esa terapeuta.');
    }
  }

  async workingHours(): Promise<WorkingHoursView> {
    const { journal, specials } = await this.journal.read();
    return toWorkingHours(journal, specials);
  }

  async saveWorkingHours(command: WorkingHoursCommand): Promise<WorkingHoursView> {
    const opensMinute = parseMinute(command.opensAt);
    const closesMinute = parseMinute(command.closesAt);
    if (opensMinute === null || closesMinute === null || closesMinute <= opensMinute) {
      throw new SchedulingError('INVALID_JOURNAL', 'La jornada necesita una hora de apertura y un cierre posterior.');
    }
    const record: JournalRecord = {
      opensMinute,
      closesMinute,
      openDays: [
        command.sunday,
        command.monday,
        command.tuesday,
        command.wednesday,
        command.thursday,
        command.friday,
        command.saturday,
      ],
      allowWeekends: command.allowWeekends,
      allowHolidays: command.allowHolidays,
      allowHalfDays: command.allowHalfDays,
    };
    await this.journal.save(record);
    return this.workingHours();
  }

  async addSpecialDay(command: SpecialDayCommand): Promise<WorkingHoursView> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(command.day)) {
      throw new SchedulingError('INVALID_JOURNAL', 'La fecha del día especial no es válida.');
    }
    if (command.kind === 'holiday') {
      await this.journal.addSpecial({ day: command.day, kind: 'holiday', opensMinute: null, closesMinute: null });
      return this.workingHours();
    }
    const opensMinute = parseMinute(command.opensAt ?? '');
    const closesMinute = parseMinute(command.closesAt ?? '');
    if (opensMinute === null || closesMinute === null || closesMinute <= opensMinute) {
      throw new SchedulingError('INVALID_JOURNAL', 'El medio día necesita una hora de apertura y un cierre posterior.');
    }
    await this.journal.addSpecial({ day: command.day, kind: 'half_day', opensMinute, closesMinute });
    return this.workingHours();
  }

  async removeSpecialDay(day: string): Promise<WorkingHoursView> {
    await this.journal.removeSpecial(day);
    return this.workingHours();
  }

  async slotIsOpen(startsAt: Date, endsAt: Date): Promise<boolean> {
    const { journal, specials } = await this.journal.read();
    return slotFits(journal, specials, startsAt, endsAt);
  }

  async windows(from: string, to: string): Promise<DayWindow[]> {
    const { journal, specials } = await this.journal.read();
    const windows: DayWindow[] = [];
    for (const day of eachDay(from, to)) {
      const weekday = spaDay(new Date(`${day}T18:00:00.000Z`)).weekday;
      const window = windowFor(journal, specials, day, weekday);
      if (window) {
        windows.push(window);
      }
    }
    return windows;
  }
}

export function therapistName(record: { givenName: string; familyName: string }): string {
  return [record.givenName.trim(), record.familyName.trim()].filter(Boolean).join(' ');
}

function toView(record: TherapistRecord): TherapistView {
  return {
    id: record.id,
    givenName: record.givenName,
    familyName: record.familyName,
    name: therapistName(record),
  };
}

function toWorkingHours(journal: JournalRecord, specials: SpecialDayRecord[]): WorkingHoursView {
  const [sunday, monday, tuesday, wednesday, thursday, friday, saturday] = journal.openDays;
  return {
    opensAt: formatMinute(journal.opensMinute),
    closesAt: formatMinute(journal.closesMinute),
    sunday,
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    allowWeekends: journal.allowWeekends,
    allowHolidays: journal.allowHolidays,
    allowHalfDays: journal.allowHalfDays,
    days: specials.map((day) => ({
      day: day.day,
      kind: day.kind,
      opensAt: day.opensMinute === null ? null : formatMinute(day.opensMinute),
      closesAt: day.closesMinute === null ? null : formatMinute(day.closesMinute),
    })),
  };
}

function requireName(value: string, label: 'nombre' | 'apellido'): string {
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 40) {
    throw new SchedulingError('INVALID_THERAPIST', `El ${label} debe tener entre 2 y 40 caracteres.`);
  }
  return trimmed;
}
