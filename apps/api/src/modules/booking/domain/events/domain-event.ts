export interface DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: Record<string, unknown>;
}

export const BookingEvents = {
  ReservationScheduled: 'booking.reservation.scheduled',
  ReservationConfirmed: 'booking.reservation.confirmed',
  ReservationCancelled: 'booking.reservation.cancelled',
  WaitlistJoined: 'booking.waitlist.joined',
  WaitlistSpotOpened: 'booking.waitlist.spot-opened',
} as const;
