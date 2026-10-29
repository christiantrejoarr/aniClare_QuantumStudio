import { DomainError } from '../../domain/errors/domain-error';
import { ServiceRepository } from '../../domain/ports/service-repository.port';
import { ServiceId } from '../../domain/value-objects/service-id';

export class RemoveServiceUseCase {
  constructor(private readonly services: ServiceRepository) {}

  async execute(serviceId: string): Promise<void> {
    const id = ServiceId.from(serviceId);
    const service = await this.services.findById(id);
    if (!service) {
      throw new DomainError('SERVICE_NOT_FOUND', 'Ese servicio no está en el catálogo.');
    }
    await this.services.delete(id);
  }
}
