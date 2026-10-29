import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';

@Injectable()
export class SchedulingSchemaInitializer implements OnModuleInit {
  private readonly logger = new Logger(SchedulingSchemaInitializer.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    const roster = readFileSync(join(__dirname, 'sql', '001_scheduling.sql'), 'utf8');
    const hours = readFileSync(join(__dirname, 'sql', '002_scheduling_hours.sql'), 'utf8');
    await this.dataSource.query(roster);
    await this.dataSource.query(hours);
    this.logger.log('Plantilla de terapeutas lista');
  }
}
