import { Reservation } from '../domain/entities/reservation';
import { WaitlistEntry } from '../domain/entities/waitlist-entry';
import { DepositStatus } from '../domain/value-objects/deposit';
import { ReservationStatus } from '../domain/entities/reservation';
import { WaitlistStatus } from '../domain/entities/waitlist-entry';

export interface ReservationView {
  reservationId: string;
  customerId: string;
  serviceId: string;
  serviceName: string | null;
  therapistId: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  status: ReservationStatus;
  depositAmountCents: number;
  depositCurrency: 'MXN';
  depositStatus: DepositStatus;
  paymentReference: string | null;
  holdExpiresAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface CancellationView extends ReservationView {
  refundPercent: number;
  waitlistNotifiedEntryId: string | null;
}

export interface WaitlistView {
  waitlistEntryId: string;
  customerId: string;
  serviceId: string;
  serviceName: string | null;
  therapistId: string;
  startsAt: string;
  endsAt: string;
  status: WaitlistStatus;
  createdAt: string;
}

export function toReservationView(reservation: Reservation, serviceName: string | null): ReservationView {
  return {
    reservationId: reservation.id.value,
    customerId: reservation.customerId.value,
    serviceId: reservation.serviceId.value,
    serviceName,
    therapistId: reservation.therapistId.value,
    startsAt: reservation.slot.startsAt.toISOString(),
    endsAt: reservation.slot.endsAt.toISOString(),
    durationMinutes: reservation.slot.durationMinutes,
    status: reservation.status,
    depositAmountCents: reservation.deposit.amount.amountCents,
    depositCurrency: reservation.deposit.amount.currency,
    depositStatus: reservation.deposit.status,
    paymentReference: reservation.paymentReference,
    holdExpiresAt: reservation.holdExpiresAt?.toISOString() ?? null,
    cancelledAt: reservation.cancelledAt?.toISOString() ?? null,
    createdAt: reservation.createdAt.toISOString(),
  };
}

export function toWaitlistView(entry: WaitlistEntry, serviceName: string | null): WaitlistView {
  return {
    waitlistEntryId: entry.id.value,
    customerId: entry.customerId.value,
    serviceId: entry.serviceId.value,
    serviceName,
    therapistId: entry.therapistId.value,
    startsAt: entry.slot.startsAt.toISOString(),
    endsAt: entry.slot.endsAt.toISOString(),
    status: entry.status,
    createdAt: entry.createdAt.toISOString(),
  };
}
