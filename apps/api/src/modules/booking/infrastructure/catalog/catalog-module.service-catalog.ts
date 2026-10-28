import { Injectable } from '@nestjs/common';
import { CatalogFacade } from '../../../catalog/public/catalog-facade';
import { ServiceCatalog, ServiceOffering } from '../../domain/ports/service-catalog.port';
import { ServiceId } from '../../domain/value-objects/identifiers';
import { Money } from '../../domain/value-objects/money';

@Injectable()
export class CatalogModuleServiceCatalog implements ServiceCatalog {
  constructor(private readonly catalog: CatalogFacade) {}

  async findById(id: ServiceId): Promise<ServiceOffering | null> {
    const service = await this.catalog.findPublished(id.value);
    if (!service) {
      return null;
    }
    return {
      id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      deposit: Money.mxn(service.depositCents),
    };
  }
}
