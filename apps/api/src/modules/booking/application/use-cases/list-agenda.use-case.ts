import { keepBookedService } from '../keep-booked-service';
import { BookingRepository } from '../../domain/ports/booking-repository.port';
import { Clock } from '../../domain/ports/clock.port';
import { ServiceCatalog } from '../../domain/ports/service-catalog.port';
import { ReservationView, toReservationView } from '../reservation-view';

export class ListAgendaUseCase {
  constructor(
    private readonly repository: BookingRepository,
    private readonly catalog: ServiceCatalog,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<ReservationView[]> {
    const now = this.clock.now();
    await this.repository.expirePendingHolds(now);
    const reservations = await this.repository.listReservations();
    const views: ReservationView[] = [];
    for (const reservation of reservations) {
      await keepBookedService(reservation, this.catalog, this.repository, now);
      views.push(toReservationView(reservation));
    }
    return views;
  }
}
