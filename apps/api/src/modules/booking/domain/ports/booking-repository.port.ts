import { Reservation } from '../entities/reservation';
import { WaitlistEntry } from '../entities/waitlist-entry';
import { CustomerId, ReservationId, TherapistId } from '../value-objects/identifiers';
import { TimeSlot } from '../value-objects/time-slot';

export interface BookingRepository {
  expirePendingHolds(now: Date): Promise<void>;
  saveReservation(reservation: Reservation): Promise<void>;
  saveReservationWithWaitlist(reservation: Reservation, entry: WaitlistEntry | null): Promise<void>;
  findReservationById(id: ReservationId): Promise<Reservation | null>;
  listReservationsByCustomer(customerId: CustomerId): Promise<Reservation[]>;
  listReservations(): Promise<Reservation[]>;
  findActiveOverlap(therapistId: TherapistId, slot: TimeSlot, now: Date): Promise<Reservation | null>;
  findWaiting(customerId: CustomerId, therapistId: TherapistId, startsAt: Date): Promise<WaitlistEntry | null>;
  findNextWaiting(therapistId: TherapistId, slot: TimeSlot): Promise<WaitlistEntry | null>;
  saveWaitlist(entry: WaitlistEntry): Promise<void>;
}

export const BOOKING_REPOSITORY = Symbol('BOOKING_REPOSITORY');
