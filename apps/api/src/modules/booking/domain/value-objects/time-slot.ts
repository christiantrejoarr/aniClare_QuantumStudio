import { DomainError } from '../errors/domain-error';

export class TimeSlot {
  private constructor(
    readonly startsAt: Date,
    readonly endsAt: Date,
  ) {}

  static create(startsAt: Date, endsAt: Date): TimeSlot {
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      throw new DomainError('INVALID_SLOT', 'El horario de la cita no es válido.');
    }
    return new TimeSlot(startsAt, endsAt);
  }

  static fromStartAndDuration(startsAt: Date, durationMinutes: number): TimeSlot {
    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      throw new DomainError('INVALID_SLOT', 'La duración del servicio no es válida.');
    }
    return TimeSlot.create(startsAt, new Date(startsAt.getTime() + durationMinutes * 60_000));
  }

  overlaps(other: TimeSlot): boolean {
    return this.startsAt < other.endsAt && other.startsAt < this.endsAt;
  }

  isInThePast(now: Date): boolean {
    return this.startsAt <= now;
  }

  get durationMinutes(): number {
    return Math.round((this.endsAt.getTime() - this.startsAt.getTime()) / 60_000);
  }
}
