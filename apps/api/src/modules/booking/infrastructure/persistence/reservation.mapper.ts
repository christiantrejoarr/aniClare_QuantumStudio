import { Reservation } from '../../domain/entities/reservation';
import { CancellationPolicy } from '../../domain/value-objects/cancellation-policy';
import { Deposit } from '../../domain/value-objects/deposit';
import { CustomerId, ReservationId, ServiceId, TherapistId } from '../../domain/value-objects/identifiers';
import { Money } from '../../domain/value-objects/money';
import { TimeSlot } from '../../domain/value-objects/time-slot';
import { ReservationOrmEntity } from './reservation.orm-entity';

export function reservationToOrm(reservation: Reservation): ReservationOrmEntity {
  const row = new ReservationOrmEntity();
  row.id = reservation.id.value;
  row.customerId = reservation.customerId.value;
  row.serviceId = reservation.serviceId.value;
  row.therapistId = reservation.therapistId.value;
  row.startsAt = reservation.slot.startsAt;
  row.endsAt = reservation.slot.endsAt;
  row.status = reservation.status;
  row.depositAmountCents = reservation.deposit.amount.amountCents;
  row.depositCurrency = reservation.deposit.amount.currency;
  row.depositStatus = reservation.deposit.status;
  row.cancellationNoticeHours = reservation.policy.noticeHours;
  row.cancellationLateRefundPercent = reservation.policy.lateRefundPercent;
  row.paymentReference = reservation.paymentReference;
  row.serviceName = reservation.serviceName || null;
  row.priceCents = reservation.serviceName ? reservation.price.amountCents : null;
  row.holdExpiresAt = reservation.holdExpiresAt;
  row.cancelledAt = reservation.cancelledAt;
  row.createdAt = reservation.createdAt;
  row.updatedAt = reservation.updatedAt;
  return row;
}

export function reservationToDomain(row: ReservationOrmEntity): Reservation {
  return Reservation.restore({
    id: ReservationId.from(row.id),
    customerId: CustomerId.from(row.customerId),
    serviceId: ServiceId.from(row.serviceId),
    therapistId: TherapistId.from(row.therapistId),
    slot: TimeSlot.create(new Date(row.startsAt), new Date(row.endsAt)),
    status: row.status,
    deposit: Deposit.restore(Money.mxn(row.depositAmountCents), row.depositStatus),
    policy: CancellationPolicy.create(row.cancellationNoticeHours, row.cancellationLateRefundPercent),
    paymentReference: row.paymentReference,
    serviceName: row.serviceName ?? '',
    price: Money.mxn(row.priceCents ?? 0),
    holdExpiresAt: row.holdExpiresAt ? new Date(row.holdExpiresAt) : null,
    cancelledAt: row.cancelledAt ? new Date(row.cancelledAt) : null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  });
}
