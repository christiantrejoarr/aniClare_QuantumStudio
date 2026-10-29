import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';

@Injectable()
export class BookingSchemaInitializer implements OnModuleInit {
  private readonly logger = new Logger(BookingSchemaInitializer.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    const folder = join(__dirname, 'sql');
    await this.dataSource.query(readFileSync(join(folder, '001_booking.sql'), 'utf8'));
    await this.dataSource.query(readFileSync(join(folder, '002_booking_snapshot.sql'), 'utf8'));
    this.logger.log('Schema booking listo');
  }
}
