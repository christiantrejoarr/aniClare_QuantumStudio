import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainError as BookingDomainError } from '../../../booking/domain/errors/domain-error';
import { DomainError as CatalogDomainError } from '../../../catalog/domain/errors/domain-error';
import { IdentityError } from '../../../identity/public';
import { SchedulingError } from '../../../scheduling/public';

const HTTP_STATUS: Record<string, number> = {
  SERVICE_NOT_FOUND: HttpStatus.NOT_FOUND,
  INVALID_SERVICE: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_PRICE: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_MONEY: HttpStatus.UNPROCESSABLE_ENTITY,
  RESERVATION_NOT_FOUND: HttpStatus.NOT_FOUND,
  RESERVATION_NOT_CANCELLABLE: HttpStatus.UNPROCESSABLE_ENTITY,
  RESERVATION_NOT_ATTENDABLE: HttpStatus.UNPROCESSABLE_ENTITY,
  USER_NOT_FOUND: HttpStatus.NOT_FOUND,
  USERNAME_TAKEN: HttpStatus.CONFLICT,
  INVALID_USER: HttpStatus.UNPROCESSABLE_ENTITY,
  LAST_ADMIN: HttpStatus.UNPROCESSABLE_ENTITY,
  CANNOT_DELETE_SELF: HttpStatus.UNPROCESSABLE_ENTITY,
  THERAPIST_NOT_FOUND: HttpStatus.NOT_FOUND,
  INVALID_THERAPIST: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_JOURNAL: HttpStatus.UNPROCESSABLE_ENTITY,
  OUTSIDE_WORKING_HOURS: HttpStatus.UNPROCESSABLE_ENTITY,
};

@Catch(CatalogDomainError, BookingDomainError, IdentityError, SchedulingError)
export class CatalogExceptionFilter implements ExceptionFilter {
  catch(exception: CatalogDomainError | BookingDomainError | IdentityError | SchedulingError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(HTTP_STATUS[exception.code] ?? HttpStatus.BAD_REQUEST).json({
      code: exception.code,
      message: exception.message,
    });
  }
}
