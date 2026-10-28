import { Injectable } from '@nestjs/common';
import { ServiceView } from '../application/service-view';
import { GetPublishedServiceUseCase } from '../application/use-cases/get-published-service.use-case';
import { ListManagedServicesUseCase } from '../application/use-cases/list-managed-services.use-case';
import { ListPublishedServicesUseCase } from '../application/use-cases/list-published-services.use-case';
import { ReviseServiceCommand, ReviseServiceUseCase } from '../application/use-cases/revise-service.use-case';

@Injectable()
export class CatalogFacade {
  constructor(
    private readonly listPublished: ListPublishedServicesUseCase,
    private readonly getPublished: GetPublishedServiceUseCase,
    private readonly listAll: ListManagedServicesUseCase,
    private readonly reviseService: ReviseServiceUseCase,
  ) {}

  list(): Promise<ServiceView[]> {
    return this.listPublished.execute();
  }

  findPublished(serviceId: string): Promise<ServiceView | null> {
    return this.getPublished.execute(serviceId);
  }

  listManaged(): Promise<ServiceView[]> {
    return this.listAll.execute();
  }

  revise(command: ReviseServiceCommand): Promise<ServiceView> {
    return this.reviseService.execute(command);
  }
}
