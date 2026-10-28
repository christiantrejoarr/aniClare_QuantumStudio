import { DomainError } from '../../domain/errors/domain-error';
import { ServiceRepository } from '../../domain/ports/service-repository.port';
import { Money } from '../../domain/value-objects/money';
import { ServiceId } from '../../domain/value-objects/service-id';
import { ServiceView, toServiceView } from '../service-view';

export interface ReviseServiceCommand {
  serviceId: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  depositCents: number;
  active: boolean;
}

export class ReviseServiceUseCase {
  constructor(private readonly services: ServiceRepository) {}

  async execute(command: ReviseServiceCommand): Promise<ServiceView> {
    const service = await this.services.findById(ServiceId.from(command.serviceId));
    if (!service) {
      throw new DomainError('SERVICE_NOT_FOUND', 'Ese servicio no está en el catálogo.');
    }
    service.revise({
      name: command.name,
      description: command.description,
      durationMinutes: command.durationMinutes,
      price: Money.mxn(command.priceCents),
      deposit: Money.mxn(command.depositCents),
      active: command.active,
      now: new Date(),
    });
    await this.services.save(service);
    return toServiceView(service);
  }
}
