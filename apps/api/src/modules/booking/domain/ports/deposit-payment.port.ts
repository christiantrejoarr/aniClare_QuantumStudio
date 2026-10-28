import { CustomerId, ReservationId } from '../value-objects/identifiers';
import { Money } from '../value-objects/money';

export interface DepositPaymentRequest {
  reservationId: ReservationId;
  customerId: CustomerId;
  amount: Money;
}

export interface DepositPayment {
  request(input: DepositPaymentRequest): Promise<{ reference: string }>;
}

export const DEPOSIT_PAYMENT = Symbol('DEPOSIT_PAYMENT');
