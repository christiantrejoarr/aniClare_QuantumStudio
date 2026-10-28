import { Service } from '../domain/entities/service';

export interface ServiceView {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  depositCents: number;
  currency: 'MXN';
  active: boolean;
}

export function toServiceView(service: Service): ServiceView {
  return {
    id: service.id.value,
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    priceCents: service.price.amountCents,
    depositCents: service.deposit.amountCents,
    currency: service.price.currency,
    active: service.active,
  };
}
