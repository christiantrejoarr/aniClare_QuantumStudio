import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../../../catalog/domain/errors/domain-error';

const HTTP_STATUS: Record<string, number> = {
  SERVICE_NOT_FOUND: HttpStatus.NOT_FOUND,
  INVALID_SERVICE: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_PRICE: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_MONEY: HttpStatus.UNPROCESSABLE_ENTITY,
};

@Catch(DomainError)
export class CatalogExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(HTTP_STATUS[exception.code] ?? HttpStatus.BAD_REQUEST).json({
      code: exception.code,
      message: exception.message,
    });
  }
}
