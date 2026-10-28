import { IsISO8601, IsUUID } from 'class-validator';

export class ScheduleReservationDto {
  @IsUUID()
  customerId!: string;

  @IsUUID()
  serviceId!: string;

  @IsUUID()
  therapistId!: string;

  @IsISO8601({ strict: true })
  startsAt!: string;
}
