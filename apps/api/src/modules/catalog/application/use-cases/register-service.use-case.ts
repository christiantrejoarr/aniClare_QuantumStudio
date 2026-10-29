import { Service } from '../../domain/entities/service';
import { ServiceRepository } from '../../domain/ports/service-repository.port';
import { Money } from '../../domain/value-objects/money';
import { ServiceId } from '../../domain/value-objects/service-id';
import { ServiceView, toServiceView } from '../service-view';

export interface RegisterServiceCommand {
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  depositCents: number;
  active: boolean;
}

export class RegisterServiceUseCase {
  constructor(private readonly services: ServiceRepository) {}

  async execute(command: RegisterServiceCommand): Promise<ServiceView> {
    const service = Service.register({
      id: ServiceId.generate(),
      name: command.name,
      description: command.description,
      durationMinutes: command.durationMinutes,
      price: Money.mxn(command.priceCents),
      deposit: Money.mxn(command.depositCents),
      now: new Date(),
    });
    if (!command.active) {
      service.revise({
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price,
        deposit: service.deposit,
        active: false,
        now: service.updatedAt,
      });
    }
    await this.services.save(service);
    return toServiceView(service);
  }
}
