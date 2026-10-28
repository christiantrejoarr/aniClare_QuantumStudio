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
    const names = new Map<string, string | null>();
    const views: ReservationView[] = [];

    for (const reservation of reservations) {
      const serviceId = reservation.serviceId.value;
      if (!names.has(serviceId)) {
        const offering = await this.catalog.findById(reservation.serviceId);
        names.set(serviceId, offering?.name ?? null);
      }
      views.push(toReservationView(reservation, names.get(serviceId) ?? null));
    }
    return views;
  }
}
