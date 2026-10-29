import { TherapistId } from '../value-objects/identifiers';

export const THERAPIST_DIRECTORY = Symbol('THERAPIST_DIRECTORY');

export interface TherapistDirectory {
  isBookable(id: TherapistId): Promise<boolean>;
}
