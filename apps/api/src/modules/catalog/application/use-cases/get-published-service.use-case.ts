import { ServiceRepository } from '../../domain/ports/service-repository.port';
import { ServiceId } from '../../domain/value-objects/service-id';
import { ServiceView, toServiceView } from '../service-view';

export class GetPublishedServiceUseCase {
  constructor(private readonly services: ServiceRepository) {}

  async execute(serviceId: string): Promise<ServiceView | null> {
    const service = await this.services.findById(ServiceId.from(serviceId));
    if (!service?.active) {
      return null;
    }
    return toServiceView(service);
  }
}
