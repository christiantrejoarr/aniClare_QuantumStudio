import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Service } from '../../domain/entities/service';
import { ServiceRepository } from '../../domain/ports/service-repository.port';
import { ServiceId } from '../../domain/value-objects/service-id';
import { serviceToDomain, serviceToOrm } from './service.mapper';
import { ServiceOrmEntity } from './service.orm-entity';

@Injectable()
export class TypeOrmServiceRepository implements ServiceRepository {
  constructor(private readonly dataSource: DataSource) {}

  async save(service: Service): Promise<void> {
    await this.dataSource.getRepository(ServiceOrmEntity).save(serviceToOrm(service));
  }

  async findById(id: ServiceId): Promise<Service | null> {
    const row = await this.dataSource.getRepository(ServiceOrmEntity).findOne({ where: { id: id.value } });
    return row ? serviceToDomain(row) : null;
  }

  async listActive(): Promise<Service[]> {
    const rows = await this.dataSource.getRepository(ServiceOrmEntity).find({
      where: { active: true },
      order: { name: 'ASC' },
    });
    return rows.map(serviceToDomain);
  }

  async listAll(): Promise<Service[]> {
    const rows = await this.dataSource.getRepository(ServiceOrmEntity).find({
      order: { name: 'ASC' },
    });
    return rows.map(serviceToDomain);
  }
}
