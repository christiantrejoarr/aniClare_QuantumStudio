import { TimeSlot } from '../value-objects/time-slot';

export interface WorkingHours {
  isOpen(slot: TimeSlot): Promise<boolean>;
}

export const WORKING_HOURS = Symbol('WORKING_HOURS');
