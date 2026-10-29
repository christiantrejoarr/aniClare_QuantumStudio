import { Reservation } from '../domain/entities/reservation';
import { BookingRepository } from '../domain/ports/booking-repository.port';
import { ServiceCatalog } from '../domain/ports/service-catalog.port';

export async function keepBookedService(
  reservation: Reservation,
  catalog: ServiceCatalog,
  repository: BookingRepository,
  now: Date,
): Promise<void> {
  if (reservation.serviceName) {
    return;
  }
  const offering = await catalog.findRecorded(reservation.serviceId);
  if (!offering) {
    return;
  }
  if (reservation.rememberService(offering.name, offering.price, now)) {
    await repository.saveReservation(reservation);
  }
}
