import { Injectable } from '@nestjs/common';
import { SchedulingFacade } from '../../../scheduling/public/scheduling-facade';
import { TherapistDirectory } from '../../domain/ports/therapist-directory.port';
import { TherapistId } from '../../domain/value-objects/identifiers';

@Injectable()
export class SchedulingModuleTherapistDirectory implements TherapistDirectory {
  constructor(private readonly scheduling: SchedulingFacade) {}

  isBookable(id: TherapistId): Promise<boolean> {
    return this.scheduling.isBookable(id.value);
  }
}
