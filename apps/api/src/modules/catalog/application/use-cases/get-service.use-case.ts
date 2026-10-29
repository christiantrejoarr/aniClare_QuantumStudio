import { ServiceRepository } from '../../domain/ports/service-repository.port';
import { ServiceId } from '../../domain/value-objects/service-id';
import { ServiceView, toServiceView } from '../service-view';

export class GetServiceUseCase {
  constructor(private readonly services: ServiceRepository) {}

  async execute(serviceId: string): Promise<ServiceView | null> {
    const service = await this.services.findById(ServiceId.from(serviceId));
    return service ? toServiceView(service) : null;
  }
}
