import { Injectable } from '@nestjs/common';
import { ServiceView } from '../application/service-view';
import { GetPublishedServiceUseCase } from '../application/use-cases/get-published-service.use-case';
import { ListManagedServicesUseCase } from '../application/use-cases/list-managed-services.use-case';
import { ListPublishedServicesUseCase } from '../application/use-cases/list-published-services.use-case';
import { GetServiceUseCase } from '../application/use-cases/get-service.use-case';
import { RegisterServiceCommand, RegisterServiceUseCase } from '../application/use-cases/register-service.use-case';
import { RemoveServiceUseCase } from '../application/use-cases/remove-service.use-case';
import { ReviseServiceCommand, ReviseServiceUseCase } from '../application/use-cases/revise-service.use-case';

@Injectable()
export class CatalogFacade {
  constructor(
    private readonly listPublished: ListPublishedServicesUseCase,
    private readonly getPublished: GetPublishedServiceUseCase,
    private readonly getAny: GetServiceUseCase,
    private readonly listAll: ListManagedServicesUseCase,
    private readonly reviseService: ReviseServiceUseCase,
    private readonly registerService: RegisterServiceUseCase,
    private readonly removeService: RemoveServiceUseCase,
  ) {}

  list(): Promise<ServiceView[]> {
    return this.listPublished.execute();
  }

  findPublished(serviceId: string): Promise<ServiceView | null> {
    return this.getPublished.execute(serviceId);
  }

  findAny(serviceId: string): Promise<ServiceView | null> {
    return this.getAny.execute(serviceId);
  }

  listManaged(): Promise<ServiceView[]> {
    return this.listAll.execute();
  }

  revise(command: ReviseServiceCommand): Promise<ServiceView> {
    return this.reviseService.execute(command);
  }

  register(command: RegisterServiceCommand): Promise<ServiceView> {
    return this.registerService.execute(command);
  }

  remove(serviceId: string): Promise<void> {
    return this.removeService.execute(serviceId);
  }
}
