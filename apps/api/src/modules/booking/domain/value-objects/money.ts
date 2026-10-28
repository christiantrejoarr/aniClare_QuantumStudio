import { DomainError } from '../errors/domain-error';

export class Money {
  private constructor(
    readonly amountCents: number,
    readonly currency: 'MXN',
  ) {}

  static mxn(amountCents: number): Money {
    if (!Number.isInteger(amountCents) || amountCents < 0) {
      throw new DomainError('INVALID_MONEY', 'El monto del anticipo no es válido.');
    }
    return new Money(amountCents, 'MXN');
  }
}
