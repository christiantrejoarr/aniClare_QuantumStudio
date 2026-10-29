import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../../domain/errors/domain-error';

const HTTP_STATUS: Record<string, number> = {
  SLOT_SATURATED: HttpStatus.CONFLICT,
  SLOT_STILL_AVAILABLE: HttpStatus.CONFLICT,
  ALREADY_ON_WAITLIST: HttpStatus.CONFLICT,
  CUSTOMER_ALREADY_BOOKED: HttpStatus.CONFLICT,
  HOLD_EXPIRED: HttpStatus.CONFLICT,
  DEPOSIT_ALREADY_SETTLED: HttpStatus.CONFLICT,
  RESERVATION_NOT_CANCELLABLE: HttpStatus.CONFLICT,
  WAITLIST_NOT_WAITING: HttpStatus.CONFLICT,
  RESERVATION_NOT_FOUND: HttpStatus.NOT_FOUND,
  UNKNOWN_SERVICE: HttpStatus.UNPROCESSABLE_ENTITY,
  UNKNOWN_THERAPIST: HttpStatus.UNPROCESSABLE_ENTITY,
  SLOT_IN_THE_PAST: HttpStatus.UNPROCESSABLE_ENTITY,
  OUTSIDE_WORKING_HOURS: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_SLOT: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_MONEY: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_POLICY: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_CUSTOMER: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_SERVICE: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_THERAPIST: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_RESERVATION: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_WAITLIST: HttpStatus.UNPROCESSABLE_ENTITY,
};

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(HTTP_STATUS[exception.code] ?? HttpStatus.BAD_REQUEST).json({
      code: exception.code,
      message: exception.message,
    });
  }
}
