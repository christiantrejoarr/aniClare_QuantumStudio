import { Controller, Get, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { GetPublishedServiceUseCase } from '../../application/use-cases/get-published-service.use-case';
import { ListPublishedServicesUseCase } from '../../application/use-cases/list-published-services.use-case';

@Controller('services')
export class CatalogController {
  constructor(
    private readonly listPublished: ListPublishedServicesUseCase,
    private readonly getPublished: GetPublishedServiceUseCase,
  ) {}

  @Get()
  list() {
    return this.listPublished.execute();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const service = await this.getPublished.execute(id);
    if (!service) {
      throw new NotFoundException({ code: 'SERVICE_NOT_FOUND', message: 'Ese servicio no está en el catálogo.' });
    }
    return service;
  }
}
