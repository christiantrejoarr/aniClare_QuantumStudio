import { WaitlistEntry } from '../../domain/entities/waitlist-entry';
import { DomainError } from '../../domain/errors/domain-error';
import { waitlistJoined } from '../../domain/events/booking-events';
import { BookingRepository } from '../../domain/ports/booking-repository.port';
import { Clock } from '../../domain/ports/clock.port';
import { EventPublisher } from '../../domain/ports/event-publisher.port';
import { ServiceCatalog } from '../../domain/ports/service-catalog.port';
import { CustomerId, ServiceId, TherapistId, WaitlistEntryId } from '../../domain/value-objects/identifiers';
import { TimeSlot } from '../../domain/value-objects/time-slot';
import { WaitlistView, toWaitlistView } from '../reservation-view';

export interface JoinWaitlistCommand {
  customerId: string;
  serviceId: string;
  therapistId: string;
  startsAt: Date;
}

export class JoinWaitlistUseCase {
  constructor(
    private readonly catalog: ServiceCatalog,
    private readonly repository: BookingRepository,
    private readonly events: EventPublisher,
    private readonly clock: Clock,
  ) {}

  async execute(command: JoinWaitlistCommand): Promise<WaitlistView> {
    const now = this.clock.now();
    const serviceId = ServiceId.from(command.serviceId);
    const offering = await this.catalog.findById(serviceId);
    if (!offering) {
      throw new DomainError('UNKNOWN_SERVICE', 'Ese servicio no está en el catálogo.');
    }

    const customerId = CustomerId.from(command.customerId);
    const therapistId = TherapistId.from(command.therapistId);
    const slot = TimeSlot.fromStartAndDuration(command.startsAt, offering.durationMinutes);

    await this.repository.expirePendingHolds(now);
    const overlap = await this.repository.findActiveOverlap(therapistId, slot, now);
    if (overlap?.customerId.equals(customerId)) {
      throw new DomainError('CUSTOMER_ALREADY_BOOKED', 'Ya tienes una reserva en ese horario.');
    }
    if (!overlap) {
      throw new DomainError('SLOT_STILL_AVAILABLE', 'Ese horario está libre. Puedes reservarlo directo.');
    }

    const existing = await this.repository.findWaiting(customerId, therapistId, slot.startsAt);
    if (existing) {
      throw new DomainError('ALREADY_ON_WAITLIST', 'Ya estás en la lista de espera de ese horario.');
    }

    const entry = WaitlistEntry.join({
      id: WaitlistEntryId.generate(),
      customerId,
      serviceId,
      therapistId,
      slot,
      now,
    });
    await this.repository.saveWaitlist(entry);
    await this.events.publish([waitlistJoined(entry, offering.name, now)]);
    return toWaitlistView(entry, offering.name);
  }
}
