import { Reservation } from '../../domain/entities/reservation';
import { DomainError } from '../../domain/errors/domain-error';
import { reservationScheduled } from '../../domain/events/booking-events';
import { BookingPolicy } from '../../domain/ports/booking-policy.port';
import { BookingRepository } from '../../domain/ports/booking-repository.port';
import { Clock } from '../../domain/ports/clock.port';
import { DepositPayment } from '../../domain/ports/deposit-payment.port';
import { EventPublisher } from '../../domain/ports/event-publisher.port';
import { ServiceCatalog } from '../../domain/ports/service-catalog.port';
import { CustomerId, ReservationId, ServiceId, TherapistId } from '../../domain/value-objects/identifiers';
import { TimeSlot } from '../../domain/value-objects/time-slot';
import { ReservationView, toReservationView } from '../reservation-view';

export interface ScheduleReservationCommand {
  customerId: string;
  serviceId: string;
  therapistId: string;
  startsAt: Date;
}

export class CreateReservationUseCase {
  constructor(
    private readonly catalog: ServiceCatalog,
    private readonly policies: BookingPolicy,
    private readonly repository: BookingRepository,
    private readonly deposits: DepositPayment,
    private readonly events: EventPublisher,
    private readonly clock: Clock,
  ) {}

  async execute(command: ScheduleReservationCommand): Promise<ReservationView> {
    const now = this.clock.now();
    const serviceId = ServiceId.from(command.serviceId);
    const offering = await this.catalog.findById(serviceId);
    if (!offering) {
      throw new DomainError('UNKNOWN_SERVICE', 'Ese servicio no está en el catálogo.');
    }

    const customerId = CustomerId.from(command.customerId);
    const therapistId = TherapistId.from(command.therapistId);
    const slot = TimeSlot.fromStartAndDuration(command.startsAt, offering.durationMinutes);
    const policy = await this.policies.current();

    await this.repository.expirePendingHolds(now);
    const overlap = await this.repository.findActiveOverlap(therapistId, slot, now);
    if (overlap?.customerId.equals(customerId)) {
      throw new DomainError('CUSTOMER_ALREADY_BOOKED', 'Ya tienes una reserva en ese horario.');
    }
    if (overlap) {
      throw new DomainError(
        'SLOT_SATURATED',
        'Ese horario ya está ocupado. Puedes entrar a la lista de espera.',
      );
    }

    const reservationId = ReservationId.generate();
    let paymentReference: string | null = null;
    if (offering.deposit.amountCents > 0) {
      const payment = await this.deposits.request({
        reservationId,
        customerId,
        amount: offering.deposit,
      });
      paymentReference = payment.reference;
    }

    const reservation = Reservation.schedule({
      id: reservationId,
      customerId,
      serviceId,
      therapistId,
      slot,
      depositAmount: offering.deposit,
      policy: policy.cancellation,
      paymentReference,
      now,
      holdMinutes: policy.holdMinutes,
    });

    await this.repository.saveReservation(reservation);
    await this.events.publish([reservationScheduled(reservation, offering.name, now)]);
    return toReservationView(reservation, offering.name);
  }
}
