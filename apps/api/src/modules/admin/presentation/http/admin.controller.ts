import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseFilters, UseGuards } from '@nestjs/common';
import { AdminDesk } from '../../application/admin-desk';
import { AdminAccessGuard } from './admin-access.guard';
import { CatalogExceptionFilter } from './catalog-exception.filter';
import { ReviseServiceDto } from './revise-service.dto';

@Controller('admin')
@UseGuards(AdminAccessGuard)
@UseFilters(CatalogExceptionFilter)
export class AdminController {
  constructor(private readonly desk: AdminDesk) {}

  @Get('reservations')
  reservations() {
    return this.desk.listReservations();
  }

  @Get('services')
  services() {
    return this.desk.listServices();
  }

  @Patch('services/:id')
  revise(@Param('id', ParseUUIDPipe) id: string, @Body() body: ReviseServiceDto) {
    return this.desk.reviseService({ serviceId: id, ...body });
  }
}
