import { Injectable } from '@nestjs/common';
import { SchedulingFacade } from '../../../scheduling/public';
import { WorkingHours } from '../../domain/ports/working-hours.port';
import { TimeSlot } from '../../domain/value-objects/time-slot';

@Injectable()
export class SchedulingModuleWorkingHours implements WorkingHours {
  constructor(private readonly scheduling: SchedulingFacade) {}

  isOpen(slot: TimeSlot): Promise<boolean> {
    return this.scheduling.slotIsOpen(slot.startsAt, slot.endsAt);
  }
}
