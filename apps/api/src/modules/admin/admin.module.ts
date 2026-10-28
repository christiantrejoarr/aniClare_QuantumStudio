import { Module } from '@nestjs/common';
import { BookingFacade } from '../booking/public';
import { BookingModule } from '../booking/booking.module';
import { CatalogFacade } from '../catalog/public';
import { CatalogModule } from '../catalog/catalog.module';
import { AdminDesk } from './application/admin-desk';
import { AdminController } from './presentation/http/admin.controller';
import { AdminAccessGuard } from './presentation/http/admin-access.guard';

@Module({
  imports: [CatalogModule, BookingModule],
  controllers: [AdminController],
  providers: [
    AdminAccessGuard,
    {
      provide: AdminDesk,
      useFactory: (catalog: CatalogFacade, booking: BookingFacade) => new AdminDesk(catalog, booking),
      inject: [CatalogFacade, BookingFacade],
    },
  ],
})
export class AdminModule {}
