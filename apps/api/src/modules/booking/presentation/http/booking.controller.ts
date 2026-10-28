import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseFilters } from '@nestjs/common';
import { CancelReservationUseCase } from '../../application/use-cases/cancel-reservation.use-case';
import { ConfirmReservationDepositUseCase } from '../../application/use-cases/confirm-reservation-deposit.use-case';
import { CreateReservationUseCase } from '../../application/use-cases/create-reservation.use-case';
import { GetReservationUseCase } from '../../application/use-cases/get-reservation.use-case';
import { JoinWaitlistUseCase } from '../../application/use-cases/join-waitlist.use-case';
import { ListAppointmentHistoryUseCase } from '../../application/use-cases/list-appointment-history.use-case';
import { DomainExceptionFilter } from './domain-exception.filter';
import { ScheduleReservationDto } from './schedule-reservation.dto';

@Controller()
@UseFilters(DomainExceptionFilter)
export class BookingController {
  constructor(
    private readonly createReservation: CreateReservationUseCase,
    private readonly confirmDeposit: ConfirmReservationDepositUseCase,
    private readonly cancelReservation: CancelReservationUseCase,
    private readonly joinWaitlist: JoinWaitlistUseCase,
    private readonly getReservation: GetReservationUseCase,
    private readonly history: ListAppointmentHistoryUseCase,
  ) {}

  @Post('reservations')
  schedule(@Body() body: ScheduleReservationDto) {
    return this.createReservation.execute({
      customerId: body.customerId,
      serviceId: body.serviceId,
      therapistId: body.therapistId,
      startsAt: new Date(body.startsAt),
    });
  }

  @Get('reservations/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getReservation.execute(id);
  }

  @Post('reservations/:id/deposit-confirmations')
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.confirmDeposit.execute({ reservationId: id });
  }

  @Post('reservations/:id/cancellations')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.cancelReservation.execute({ reservationId: id });
  }

  @Get('customers/:customerId/reservations')
  list(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.history.execute(customerId);
  }

  @Post('waitlist')
  waitlist(@Body() body: ScheduleReservationDto) {
    return this.joinWaitlist.execute({
      customerId: body.customerId,
      serviceId: body.serviceId,
      therapistId: body.therapistId,
      startsAt: new Date(body.startsAt),
    });
  }
}
