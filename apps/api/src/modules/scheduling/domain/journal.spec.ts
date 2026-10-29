import { atSpaTime, JournalRecord, openStarts, slotFits, SpecialDayRecord, windowFor } from './journal';

const journal: JournalRecord = {
  opensMinute: 10 * 60,
  closesMinute: 14 * 60,
  openDays: [false, true, true, true, true, true, false],
  allowWeekends: false,
  allowHolidays: false,
  allowHalfDays: true,
};

describe('jornada', () => {
  it('ofrece horas en punto dentro de la jornada y omite las ocupadas', () => {
    const day = '2026-11-02';
    const takenStart = atSpaTime(day, 11 * 60);
    const hours = openStarts(
      { date: day, opensMinute: 10 * 60, closesMinute: 14 * 60 },
      60,
      [{ startsAt: takenStart, endsAt: new Date(takenStart.getTime() + 60 * 60_000) }],
      atSpaTime(day, 9 * 60),
    );

    expect(hours).toEqual(['10:00', '12:00', '13:00']);
  });

  it('cierra el domingo si los fines de semana no están habilitados', () => {
    expect(windowFor(journal, [], '2026-11-01', 0)).toBeNull();
  });

  it('un festivo bloqueado no se puede reservar y un medio día usa su horario corto', () => {
    const holiday: SpecialDayRecord = { day: '2026-11-02', kind: 'holiday', opensMinute: null, closesMinute: null };
    const half: SpecialDayRecord = { day: '2026-11-03', kind: 'half_day', opensMinute: 10 * 60, closesMinute: 12 * 60 };

    expect(windowFor(journal, [holiday], '2026-11-02', 1)).toBeNull();
    expect(windowFor({ ...journal, allowHolidays: true }, [holiday], '2026-11-02', 1)?.closesMinute).toBe(14 * 60);
    expect(windowFor(journal, [half], '2026-11-03', 2)).toEqual({
      date: '2026-11-03',
      opensMinute: 10 * 60,
      closesMinute: 12 * 60,
    });
  });

  it('rechaza una cita que se sale de la jornada', () => {
    const start = atSpaTime('2026-11-02', 13 * 60);
    const end = new Date(start.getTime() + 120 * 60_000);
    expect(slotFits(journal, [], start, end)).toBe(false);
    expect(slotFits(journal, [], start, new Date(start.getTime() + 60 * 60_000))).toBe(true);
  });
});
