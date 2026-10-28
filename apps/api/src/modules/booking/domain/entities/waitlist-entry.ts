import { DomainError } from '../errors/domain-error';
import { CustomerId, ServiceId, TherapistId, WaitlistEntryId } from '../value-objects/identifiers';
import { TimeSlot } from '../value-objects/time-slot';

export type WaitlistStatus = 'waiting' | 'notified' | 'cancelled';

export interface WaitlistSnapshot {
  id: WaitlistEntryId;
  customerId: CustomerId;
  serviceId: ServiceId;
  therapistId: TherapistId;
  slot: TimeSlot;
  status: WaitlistStatus;
  createdAt: Date;
  notifiedAt: Date | null;
}

export class WaitlistEntry {
  private constructor(private props: WaitlistSnapshot) {}

  static join(input: {
    id: WaitlistEntryId;
    customerId: CustomerId;
    serviceId: ServiceId;
    therapistId: TherapistId;
    slot: TimeSlot;
    now: Date;
  }): WaitlistEntry {
    if (input.slot.isInThePast(input.now)) {
      throw new DomainError('SLOT_IN_THE_PAST', 'Elige un horario que todavía no empiece.');
    }
    return new WaitlistEntry({
      id: input.id,
      customerId: input.customerId,
      serviceId: input.serviceId,
      therapistId: input.therapistId,
      slot: input.slot,
      status: 'waiting',
      createdAt: input.now,
      notifiedAt: null,
    });
  }

  static restore(snapshot: WaitlistSnapshot): WaitlistEntry {
    return new WaitlistEntry(snapshot);
  }

  get id(): WaitlistEntryId {
    return this.props.id;
  }

  get customerId(): CustomerId {
    return this.props.customerId;
  }

  get serviceId(): ServiceId {
    return this.props.serviceId;
  }

  get therapistId(): TherapistId {
    return this.props.therapistId;
  }

  get slot(): TimeSlot {
    return this.props.slot;
  }

  get status(): WaitlistStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get notifiedAt(): Date | null {
    return this.props.notifiedAt;
  }

  notify(now: Date): void {
    if (this.props.status !== 'waiting') {
      throw new DomainError('WAITLIST_NOT_WAITING', 'Esta entrada de lista de espera ya fue atendida.');
    }
    this.props.status = 'notified';
    this.props.notifiedAt = now;
  }
}
