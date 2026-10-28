import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListPublishedServicesUseCase } from './application/use-cases/list-published-services.use-case';
import { ListManagedServicesUseCase } from './application/use-cases/list-managed-services.use-case';
import { GetPublishedServiceUseCase } from './application/use-cases/get-published-service.use-case';
import { ReviseServiceUseCase } from './application/use-cases/revise-service.use-case';
import { SERVICE_REPOSITORY, ServiceRepository } from './domain/ports/service-repository.port';
import { CatalogSchemaInitializer } from './infrastructure/persistence/catalog-schema.initializer';
import { ServiceOrmEntity } from './infrastructure/persistence/service.orm-entity';
import { TypeOrmServiceRepository } from './infrastructure/persistence/typeorm-service.repository';
import { CatalogController } from './presentation/http/catalog.controller';
import { CatalogFacade } from './public/catalog-facade';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrmEntity])],
  controllers: [CatalogController],
  providers: [
    CatalogSchemaInitializer,
    TypeOrmServiceRepository,
    { provide: SERVICE_REPOSITORY, useExisting: TypeOrmServiceRepository },
    {
      provide: ListPublishedServicesUseCase,
      useFactory: (services: ServiceRepository) => new ListPublishedServicesUseCase(services),
      inject: [SERVICE_REPOSITORY],
    },
    {
      provide: GetPublishedServiceUseCase,
      useFactory: (services: ServiceRepository) => new GetPublishedServiceUseCase(services),
      inject: [SERVICE_REPOSITORY],
    },
    {
      provide: ListManagedServicesUseCase,
      useFactory: (services: ServiceRepository) => new ListManagedServicesUseCase(services),
      inject: [SERVICE_REPOSITORY],
    },
    {
      provide: ReviseServiceUseCase,
      useFactory: (services: ServiceRepository) => new ReviseServiceUseCase(services),
      inject: [SERVICE_REPOSITORY],
    },
    CatalogFacade,
  ],
  exports: [CatalogFacade],
})
export class CatalogModule {}
