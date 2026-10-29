import { keepBookedService } from '../keep-booked-service';
import { DomainError } from '../../domain/errors/domain-error';
import { reservationConfirmed } from '../../domain/events/booking-events';
import { BookingRepository } from '../../domain/ports/booking-repository.port';
import { Clock } from '../../domain/ports/clock.port';
import { EventPublisher } from '../../domain/ports/event-publisher.port';
import { ServiceCatalog } from '../../domain/ports/service-catalog.port';
import { ReservationId } from '../../domain/value-objects/identifiers';
import { ReservationView, toReservationView } from '../reservation-view';

export class ConfirmReservationDepositUseCase {
  constructor(
    private readonly repository: BookingRepository,
    private readonly catalog: ServiceCatalog,
    private readonly events: EventPublisher,
    private readonly clock: Clock,
  ) {}

  async execute(command: { reservationId: string }): Promise<ReservationView> {
    const now = this.clock.now();
    await this.repository.expirePendingHolds(now);
    const reservation = await this.repository.findReservationById(ReservationId.from(command.reservationId));
    if (!reservation) {
      throw new DomainError('RESERVATION_NOT_FOUND', 'No encontramos esa reserva.');
    }

    reservation.confirmDeposit(now);
    await keepBookedService(reservation, this.catalog, this.repository, now);
    await this.repository.saveReservation(reservation);
    await this.events.publish([reservationConfirmed(reservation, reservation.serviceName || null, now)]);
    return toReservationView(reservation);
  }
}
