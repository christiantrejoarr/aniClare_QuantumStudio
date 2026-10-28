import { ServiceRepository } from '../../domain/ports/service-repository.port';
import { ServiceView, toServiceView } from '../service-view';

export class ListManagedServicesUseCase {
  constructor(private readonly services: ServiceRepository) {}

  async execute(): Promise<ServiceView[]> {
    const services = await this.services.listAll();
    return services.map(toServiceView);
  }
}
