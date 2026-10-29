import { Service } from '../entities/service';
import { ServiceId } from '../value-objects/service-id';

export interface ServiceRepository {
  save(service: Service): Promise<void>;
  findById(id: ServiceId): Promise<Service | null>;
  listActive(): Promise<Service[]>;
  listAll(): Promise<Service[]>;
  delete(id: ServiceId): Promise<void>;
}

export const SERVICE_REPOSITORY = Symbol('SERVICE_REPOSITORY');
