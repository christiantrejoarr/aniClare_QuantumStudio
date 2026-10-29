import { DomainError } from '../../domain/errors/domain-error';
import { BookingRepository } from '../../domain/ports/booking-repository.port';
import { Clock } from '../../domain/ports/clock.port';
import { ServiceCatalog } from '../../domain/ports/service-catalog.port';
import { TherapistDirectory } from '../../domain/ports/therapist-directory.port';
import { ServiceId, TherapistId } from '../../domain/value-objects/identifiers';
import { eachDay, openStarts, SchedulingFacade, shiftDay, TakenSpan } from '../../../scheduling/public';

export interface AvailabilityDay {
  date: string;
  hours: string[];
}

export class ListAvailabilityUseCase {
  constructor(
    private readonly catalog: ServiceCatalog,
    private readonly therapists: TherapistDirectory,
    private readonly scheduling: SchedulingFacade,
    private readonly repository: BookingRepository,
    private readonly clock: Clock,
  ) {}

  async execute(query: { therapistId: string; serviceId: string; from: string; to: string }): Promise<AvailabilityDay[]> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(query.from) || !/^\d{4}-\d{2}-\d{2}$/.test(query.to) || query.to < query.from) {
      throw new DomainError('INVALID_SLOT', 'El rango de fechas no es válido.');
    }
    if (eachDay(query.from, query.to).length > 62 || shiftDay(query.from, 62) < query.to) {
      throw new DomainError('INVALID_SLOT', 'El calendario solo consulta dos meses por vez.');
    }

    const serviceId = ServiceId.from(query.serviceId);
    const offering = await this.catalog.findById(serviceId);
    if (!offering) {
      throw new DomainError('UNKNOWN_SERVICE', 'Ese servicio no está en el catálogo.');
    }
    const therapistId = TherapistId.from(query.therapistId);
    if (!(await this.therapists.isBookable(therapistId))) {
      throw new DomainError('UNKNOWN_THERAPIST', 'Esa terapeuta no está en el equipo.');
    }

    const now = this.clock.now();
    await this.repository.expirePendingHolds(now);
    const taken = await this.takenSpans(therapistId, now);
    const windows = await this.scheduling.windows(query.from, query.to);
    const byDate = new Map(windows.map((window) => [window.date, window]));

    return eachDay(query.from, query.to).map((date) => {
      const window = byDate.get(date);
      return {
        date,
        hours: window ? openStarts(window, offering.durationMinutes, taken, now) : [],
      };
    });
  }

  private async takenSpans(therapistId: TherapistId, now: Date): Promise<TakenSpan[]> {
    const reservations = await this.repository.listReservations();
    return reservations
      .filter((reservation) => reservation.therapistId.equals(therapistId) && reservation.holdsSlot(now))
      .map((reservation) => ({ startsAt: reservation.slot.startsAt, endsAt: reservation.slot.endsAt }));
  }
}
