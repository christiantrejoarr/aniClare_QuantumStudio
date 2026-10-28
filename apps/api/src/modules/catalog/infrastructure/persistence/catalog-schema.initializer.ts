import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';

@Injectable()
export class CatalogSchemaInitializer implements OnModuleInit {
  private readonly logger = new Logger(CatalogSchemaInitializer.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    const sql = readFileSync(join(__dirname, 'sql', '001_catalog.sql'), 'utf8');
    await this.dataSource.query(sql);
    this.logger.log('Schema catalog listo');
  }
}
