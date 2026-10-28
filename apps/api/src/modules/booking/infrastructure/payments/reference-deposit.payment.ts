import { Injectable } from '@nestjs/common';
import { DepositPayment, DepositPaymentRequest } from '../../domain/ports/deposit-payment.port';

@Injectable()
export class ReferenceDepositPayment implements DepositPayment {
  async request(input: DepositPaymentRequest): Promise<{ reference: string }> {
    return { reference: `dep_${input.reservationId.value}` };
  }
}
