import { DomainError } from '../errors/domain-error';
import { CancellationPolicy } from '../value-objects/cancellation-policy';
import { Deposit } from '../value-objects/deposit';
import { CustomerId, ReservationId, ServiceId, TherapistId } from '../value-objects/identifiers';
import { Money } from '../value-objects/money';
import { TimeSlot } from '../value-objects/time-slot';

export type ReservationStatus = 'pending_payment' | 'confirmed' | 'cancelled' | 'expired';

export interface ScheduleReservationInput {
  id: ReservationId;
  customerId: CustomerId;
  serviceId: ServiceId;
  therapistId: TherapistId;
  slot: TimeSlot;
  depositAmount: Money;
  policy: CancellationPolicy;
  paymentReference: string | null;
  now: Date;
  holdMinutes: number;
}

export interface ReservationSnapshot {
  id: ReservationId;
  customerId: CustomerId;
  serviceId: ServiceId;
  therapistId: TherapistId;
  slot: TimeSlot;
  status: ReservationStatus;
  deposit: Deposit;
  policy: CancellationPolicy;
  paymentReference: string | null;
  holdExpiresAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Reservation {
  private constructor(private props: ReservationSnapshot) {}

  static schedule(input: ScheduleReservationInput): Reservation {
    if (input.slot.isInThePast(input.now)) {
      throw new DomainError('SLOT_IN_THE_PAST', 'Elige un horario que todavía no empiece.');
    }
    if (!Number.isInteger(input.holdMinutes) || input.holdMinutes <= 0 || input.holdMinutes > 120) {
      throw new DomainError('INVALID_POLICY', 'El tiempo de apartado del anticipo no es válido.');
    }

    const deposit = Deposit.required(input.depositAmount);
    const confirmedWithoutPayment = deposit.status === 'waived';

    return new Reservation({
      id: input.id,
      customerId: input.customerId,
      serviceId: input.serviceId,
      therapistId: input.therapistId,
      slot: input.slot,
      status: confirmedWithoutPayment ? 'confirmed' : 'pending_payment',
      deposit,
      policy: input.policy,
      paymentReference: confirmedWithoutPayment ? null : input.paymentReference,
      holdExpiresAt: confirmedWithoutPayment
        ? null
        : new Date(input.now.getTime() + input.holdMinutes * 60_000),
      cancelledAt: null,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  static restore(snapshot: ReservationSnapshot): Reservation {
    return new Reservation(snapshot);
  }

  get id(): ReservationId {
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

  get status(): ReservationStatus {
    return this.props.status;
  }

  get deposit(): Deposit {
    return this.props.deposit;
  }

  get policy(): CancellationPolicy {
    return this.props.policy;
  }

  get paymentReference(): string | null {
    return this.props.paymentReference;
  }

  get holdExpiresAt(): Date | null {
    return this.props.holdExpiresAt;
  }

  get cancelledAt(): Date | null {
    return this.props.cancelledAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  holdsSlot(now: Date): boolean {
    if (this.props.status === 'confirmed') {
      return true;
    }
    return (
      this.props.status === 'pending_payment' &&
      this.props.holdExpiresAt !== null &&
      this.props.holdExpiresAt > now
    );
  }

  attachPaymentReference(reference: string, now: Date): void {
    if (this.props.deposit.status !== 'pending' || this.props.paymentReference) {
      throw new DomainError('DEPOSIT_ALREADY_SETTLED', 'Esta reserva ya no espera el anticipo.');
    }
    this.props.paymentReference = reference;
    this.props.updatedAt = now;
  }

  confirmDeposit(now: Date): void {
    const holdLapsed = this.props.holdExpiresAt !== null && this.props.holdExpiresAt <= now;
    if (this.props.status === 'expired' || (this.props.status === 'pending_payment' && holdLapsed)) {
      throw new DomainError('HOLD_EXPIRED', 'El apartado del anticipo venció. Reserva de nuevo.');
    }
    if (this.props.status !== 'pending_payment') {
      throw new DomainError('DEPOSIT_ALREADY_SETTLED', 'Esta reserva ya no espera el anticipo.');
    }
    this.props.deposit = this.props.deposit.markPaid();
    this.props.status = 'confirmed';
    this.props.holdExpiresAt = null;
    this.props.updatedAt = now;
  }

  cancel(now: Date): { refundPercent: number } {
    if (this.props.status === 'cancelled' || this.props.status === 'expired') {
      throw new DomainError('RESERVATION_NOT_CANCELLABLE', 'Esta reserva ya no se puede cancelar.');
    }
    if (now >= this.props.slot.endsAt) {
      throw new DomainError('RESERVATION_NOT_CANCELLABLE', 'Esta reserva ya no se puede cancelar.');
    }

    let refundPercent = 0;
    if (this.props.deposit.status === 'paid') {
      refundPercent = this.props.policy.refundPercentFor(this.props.slot.startsAt, now);
      this.props.deposit =
        refundPercent === 0 ? this.props.deposit.markForfeited() : this.props.deposit.markRefundDue();
    }

    this.props.status = 'cancelled';
    this.props.cancelledAt = now;
    this.props.holdExpiresAt = null;
    this.props.updatedAt = now;
    return { refundPercent };
  }

  expireHold(now: Date): boolean {
    if (this.props.status !== 'pending_payment' || this.props.holdExpiresAt === null) {
      return false;
    }
    if (this.props.holdExpiresAt > now) {
      return false;
    }
    this.props.status = 'expired';
    this.props.updatedAt = now;
    return true;
  }
}
