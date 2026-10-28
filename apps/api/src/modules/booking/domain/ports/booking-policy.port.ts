import { CancellationPolicy } from '../value-objects/cancellation-policy';

export interface BookingPolicySnapshot {
  holdMinutes: number;
  cancellation: CancellationPolicy;
}

export interface BookingPolicy {
  current(): Promise<BookingPolicySnapshot>;
}

export const BOOKING_POLICY = Symbol('BOOKING_POLICY');
