import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { AdminModule } from './modules/admin/admin.module';
import { BookingModule } from './modules/booking/booking.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { IdentityModule } from './modules/identity/identity.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { LiveModule } from './shared/live/live.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      ignoreEnvFile: process.env.IGNORE_ENV_FILE === 'true',
    }),
    DatabaseModule,
    CatalogModule,
    SchedulingModule,
    BookingModule,
    IdentityModule,
    AdminModule,
    LiveModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
