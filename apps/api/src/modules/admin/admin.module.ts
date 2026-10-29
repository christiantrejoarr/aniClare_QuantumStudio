import { Module } from '@nestjs/common';
import { BookingFacade } from '../booking/public';
import { BookingModule } from '../booking/booking.module';
import { CatalogFacade } from '../catalog/public';
import { CatalogModule } from '../catalog/catalog.module';
import { IdentityFacade } from '../identity/public';
import { IdentityModule } from '../identity/identity.module';
import { SchedulingFacade } from '../scheduling/public';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { AdminDesk } from './application/admin-desk';
import { AdminController } from './presentation/http/admin.controller';
import { AdminAccessGuard } from './presentation/http/admin-access.guard';
import { AdminSessionController } from './presentation/http/admin-session.controller';

@Module({
  imports: [CatalogModule, BookingModule, IdentityModule, SchedulingModule],
  controllers: [AdminSessionController, AdminController],
  providers: [
    AdminAccessGuard,
    {
      provide: AdminDesk,
      useFactory: (
        catalog: CatalogFacade,
        booking: BookingFacade,
        identity: IdentityFacade,
        scheduling: SchedulingFacade,
      ) => new AdminDesk(catalog, booking, identity, scheduling),
      inject: [CatalogFacade, BookingFacade, IdentityFacade, SchedulingFacade],
    },
  ],
})
export class AdminModule {}
