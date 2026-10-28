import { DomainError } from '../../domain/errors/domain-error';
import { reservationCancelled, waitlistSpotOpened } from '../../domain/events/booking-events';
import { DomainEvent } from '../../domain/events/domain-event';
import { BookingRepository } from '../../domain/ports/booking-repository.port';
import { Clock } from '../../domain/ports/clock.port';
import { EventPublisher } from '../../domain/ports/event-publisher.port';
import { ServiceCatalog } from '../../domain/ports/service-catalog.port';
import { ReservationId } from '../../domain/value-objects/identifiers';
import { CancellationView, toReservationView } from '../reservation-view';

export class CancelReservationUseCase {
  constructor(
    private readonly repository: BookingRepository,
    private readonly catalog: ServiceCatalog,
    private readonly events: EventPublisher,
    private readonly clock: Clock,
  ) {}

  async execute(command: { reservationId: string }): Promise<CancellationView> {
    const now = this.clock.now();
    const reservation = await this.repository.findReservationById(ReservationId.from(command.reservationId));
    if (!reservation) {
      throw new DomainError('RESERVATION_NOT_FOUND', 'No encontramos esa reserva.');
    }

    const { refundPercent } = reservation.cancel(now);
    const next = reservation.slot.isInThePast(now)
      ? null
      : await this.repository.findNextWaiting(reservation.therapistId, reservation.slot);
    if (next) {
      next.notify(now);
    }

    await this.repository.saveReservationWithWaitlist(reservation, next);
    const offering = await this.catalog.findById(reservation.serviceId);
    const published: DomainEvent[] = [
      reservationCancelled(reservation, offering?.name ?? null, refundPercent, now),
    ];
    if (next) {
      published.push(waitlistSpotOpened(next, now));
    }
    await this.events.publish(published);

    return {
      ...toReservationView(reservation, offering?.name ?? null),
      refundPercent,
      waitlistNotifiedEntryId: next?.id.value ?? null,
    };
  }
}
