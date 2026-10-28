import { Reservation } from '../entities/reservation';
import { WaitlistEntry } from '../entities/waitlist-entry';
import { BookingEvents, DomainEvent } from './domain-event';

function reservationPayload(reservation: Reservation, serviceName: string | null): Record<string, unknown> {
  return {
    reservationId: reservation.id.value,
    customerId: reservation.customerId.value,
    serviceId: reservation.serviceId.value,
    serviceName,
    therapistId: reservation.therapistId.value,
    startsAt: reservation.slot.startsAt.toISOString(),
    endsAt: reservation.slot.endsAt.toISOString(),
    status: reservation.status,
    depositAmountCents: reservation.deposit.amount.amountCents,
    depositCurrency: reservation.deposit.amount.currency,
    depositStatus: reservation.deposit.status,
    paymentReference: reservation.paymentReference,
  };
}

export function reservationScheduled(
  reservation: Reservation,
  serviceName: string | null,
  occurredAt: Date,
): DomainEvent {
  return {
    eventName: BookingEvents.ReservationScheduled,
    occurredAt,
    payload: reservationPayload(reservation, serviceName),
  };
}

export function reservationConfirmed(
  reservation: Reservation,
  serviceName: string | null,
  occurredAt: Date,
): DomainEvent {
  return {
    eventName: BookingEvents.ReservationConfirmed,
    occurredAt,
    payload: reservationPayload(reservation, serviceName),
  };
}

export function reservationCancelled(
  reservation: Reservation,
  serviceName: string | null,
  refundPercent: number,
  occurredAt: Date,
): DomainEvent {
  return {
    eventName: BookingEvents.ReservationCancelled,
    occurredAt,
    payload: {
      ...reservationPayload(reservation, serviceName),
      refundPercent,
    },
  };
}

export function waitlistJoined(entry: WaitlistEntry, serviceName: string | null, occurredAt: Date): DomainEvent {
  return {
    eventName: BookingEvents.WaitlistJoined,
    occurredAt,
    payload: {
      waitlistEntryId: entry.id.value,
      customerId: entry.customerId.value,
      serviceId: entry.serviceId.value,
      serviceName,
      therapistId: entry.therapistId.value,
      startsAt: entry.slot.startsAt.toISOString(),
      endsAt: entry.slot.endsAt.toISOString(),
    },
  };
}

export function waitlistSpotOpened(entry: WaitlistEntry, occurredAt: Date): DomainEvent {
  return {
    eventName: BookingEvents.WaitlistSpotOpened,
    occurredAt,
    payload: {
      waitlistEntryId: entry.id.value,
      customerId: entry.customerId.value,
      serviceId: entry.serviceId.value,
      therapistId: entry.therapistId.value,
      startsAt: entry.slot.startsAt.toISOString(),
      endsAt: entry.slot.endsAt.toISOString(),
    },
  };
}
