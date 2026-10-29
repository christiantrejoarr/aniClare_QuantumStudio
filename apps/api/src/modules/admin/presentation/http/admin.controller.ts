import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Req, UseFilters, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AdminDesk } from '../../application/admin-desk';
import { AdminAccessGuard } from './admin-access.guard';
import { CatalogExceptionFilter } from './catalog-exception.filter';
import { ReviseServiceDto } from './revise-service.dto';
import { TherapistNameDto } from './therapist.dto';
import { SpecialDayDto, WorkingHoursDto } from './working-hours.dto';
import { ReviseUserDto, UserCredentialsDto } from './user.dto';

@Controller('admin')
@UseGuards(AdminAccessGuard)
@UseFilters(CatalogExceptionFilter)
export class AdminController {
  constructor(private readonly desk: AdminDesk) {}

  @Get('reservations')
  reservations() {
    return this.desk.listReservations();
  }

  @Post('reservations/:id/attend')
  attend(@Param('id', ParseUUIDPipe) id: string) {
    return this.desk.attendReservation(id);
  }

  @Post('reservations/:id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.desk.cancelReservation(id);
  }

  @Get('services')
  services() {
    return this.desk.listServices();
  }

  @Post('services')
  registerService(@Body() body: ReviseServiceDto) {
    return this.desk.registerService(body);
  }

  @Patch('services/:id')
  revise(@Param('id', ParseUUIDPipe) id: string, @Body() body: ReviseServiceDto) {
    return this.desk.reviseService({ serviceId: id, ...body });
  }

  @Delete('services/:id')
  removeService(@Param('id', ParseUUIDPipe) id: string) {
    return this.desk.removeService(id);
  }

  @Get('session')
  profile(@Req() request: Request & { adminUsername?: string }) {
    return this.desk.profile(request.adminUsername ?? '');
  }

  @Get('users')
  users() {
    return this.desk.listUsers();
  }

  @Post('users')
  registerUser(@Body() body: UserCredentialsDto, @Req() request: Request & { adminUsername?: string }) {
    return this.desk.registerUser(body.username, body.password, body.administrator === true, request.adminUsername ?? '');
  }

  @Patch('users/:id')
  reviseUser(@Param('id', ParseUUIDPipe) id: string, @Body() body: ReviseUserDto, @Req() request: Request & { adminUsername?: string }) {
    return this.desk.reviseUser(id, body.username, body.password, request.adminUsername ?? '');
  }

  @Delete('users/:id')
  removeUser(@Param('id', ParseUUIDPipe) id: string, @Req() request: Request & { adminUsername?: string }) {
    return this.desk.removeUser(id, request.adminUsername ?? '');
  }

  @Get('therapists')
  therapists() {
    return this.desk.listTherapists();
  }

  @Post('therapists')
  registerTherapist(@Body() body: TherapistNameDto) {
    return this.desk.registerTherapist(body.givenName, body.familyName);
  }

  @Patch('therapists/:id')
  reviseTherapist(@Param('id', ParseUUIDPipe) id: string, @Body() body: TherapistNameDto) {
    return this.desk.reviseTherapist(id, body.givenName, body.familyName);
  }

  @Delete('therapists/:id')
  removeTherapist(@Param('id', ParseUUIDPipe) id: string) {
    return this.desk.removeTherapist(id);
  }

  @Get('working-hours')
  workingHours() {
    return this.desk.workingHours();
  }

  @Put('working-hours')
  saveWorkingHours(@Body() body: WorkingHoursDto) {
    return this.desk.saveWorkingHours(body);
  }

  @Post('working-hours/days')
  addSpecialDay(@Body() body: SpecialDayDto) {
    return this.desk.addSpecialDay(body);
  }

  @Delete('working-hours/days/:day')
  removeSpecialDay(@Param('day') day: string) {
    return this.desk.removeSpecialDay(day);
  }
}
