import { Money } from '../value-objects/money';
import { ServiceId } from '../value-objects/identifiers';

export interface ServiceOffering {
  id: ServiceId;
  name: string;
  durationMinutes: number;
  price: Money;
  deposit: Money;
}

export interface ServiceCatalog {
  findById(id: ServiceId): Promise<ServiceOffering | null>;
  findRecorded(id: ServiceId): Promise<ServiceOffering | null>;
}

export const SERVICE_CATALOG = Symbol('SERVICE_CATALOG');
