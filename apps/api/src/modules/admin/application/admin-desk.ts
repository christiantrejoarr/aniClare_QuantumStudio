import { BookingFacade, ReservationView } from '../../booking/public';
import { CatalogFacade, ReviseServiceCommand, ServiceView } from '../../catalog/public';

export class AdminDesk {
  constructor(
    private readonly catalog: CatalogFacade,
    private readonly booking: BookingFacade,
  ) {}

  async listReservations(): Promise<ReservationView[]> {
    const [reservations, services] = await Promise.all([this.booking.listAgenda(), this.catalog.listManaged()]);
    const names = new Map(services.map((service) => [service.id, service.name]));
    return reservations.map((reservation) => ({
      ...reservation,
      serviceName: names.get(reservation.serviceId) ?? reservation.serviceName,
    }));
  }

  listServices(): Promise<ServiceView[]> {
    return this.catalog.listManaged();
  }

  reviseService(command: ReviseServiceCommand): Promise<ServiceView> {
    return this.catalog.revise(command);
  }
}
