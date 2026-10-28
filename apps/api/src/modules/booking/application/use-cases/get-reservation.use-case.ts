import { DomainError } from '../../domain/errors/domain-error';
import { BookingRepository } from '../../domain/ports/booking-repository.port';
import { Clock } from '../../domain/ports/clock.port';
import { ServiceCatalog } from '../../domain/ports/service-catalog.port';
import { CustomerId, ReservationId } from '../../domain/value-objects/identifiers';
import { ReservationView, toReservationView } from '../reservation-view';

export class GetReservationUseCase {
  constructor(
    private readonly repository: BookingRepository,
    private readonly catalog: ServiceCatalog,
    private readonly clock: Clock,
  ) {}

  async execute(reservationId: string): Promise<ReservationView> {
    const now = this.clock.now();
    await this.repository.expirePendingHolds(now);
    const reservation = await this.repository.findReservationById(ReservationId.from(reservationId));
    if (!reservation) {
      throw new DomainError('RESERVATION_NOT_FOUND', 'No encontramos esa reserva.');
    }
    const offering = await this.catalog.findById(reservation.serviceId);
    return toReservationView(reservation, offering?.name ?? null);
  }
}
