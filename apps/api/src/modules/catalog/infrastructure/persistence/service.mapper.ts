import { Service } from '../../domain/entities/service';
import { Money } from '../../domain/value-objects/money';
import { ServiceId } from '../../domain/value-objects/service-id';
import { ServiceOrmEntity } from './service.orm-entity';

export function serviceToOrm(service: Service): ServiceOrmEntity {
  const row = new ServiceOrmEntity();
  row.id = service.id.value;
  row.name = service.name;
  row.description = service.description;
  row.durationMinutes = service.durationMinutes;
  row.priceCents = service.price.amountCents;
  row.depositCents = service.deposit.amountCents;
  row.currency = service.price.currency;
  row.active = service.active;
  row.createdAt = service.createdAt;
  row.updatedAt = service.updatedAt;
  return row;
}

export function serviceToDomain(row: ServiceOrmEntity): Service {
  return Service.restore({
    id: ServiceId.from(row.id),
    name: row.name,
    description: row.description,
    durationMinutes: row.durationMinutes,
    price: Money.mxn(row.priceCents),
    deposit: Money.mxn(row.depositCents),
    active: row.active,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  });
}
