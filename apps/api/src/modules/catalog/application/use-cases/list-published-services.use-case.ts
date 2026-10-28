import { ServiceRepository } from '../../domain/ports/service-repository.port';
import { ServiceView, toServiceView } from '../service-view';

export class ListPublishedServicesUseCase {
  constructor(private readonly services: ServiceRepository) {}

  async execute(): Promise<ServiceView[]> {
    const published = await this.services.listActive();
    return published.map(toServiceView);
  }
}
