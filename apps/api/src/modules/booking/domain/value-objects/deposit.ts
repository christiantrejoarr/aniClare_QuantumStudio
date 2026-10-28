import { DomainError } from '../errors/domain-error';
import { Money } from './money';

export type DepositStatus = 'pending' | 'paid' | 'waived' | 'refund_due' | 'forfeited';

export class Deposit {
  private constructor(
    readonly amount: Money,
    readonly status: DepositStatus,
  ) {}

  static required(amount: Money): Deposit {
    if (amount.amountCents === 0) {
      return new Deposit(amount, 'waived');
    }
    return new Deposit(amount, 'pending');
  }

  static restore(amount: Money, status: DepositStatus): Deposit {
    return new Deposit(amount, status);
  }

  markPaid(): Deposit {
    if (this.status !== 'pending') {
      throw new DomainError('DEPOSIT_ALREADY_SETTLED', 'Esta reserva ya no espera el anticipo.');
    }
    return new Deposit(this.amount, 'paid');
  }

  markRefundDue(): Deposit {
    if (this.status !== 'paid') {
      throw new DomainError('DEPOSIT_ALREADY_SETTLED', 'El anticipo no está pagado.');
    }
    return new Deposit(this.amount, 'refund_due');
  }

  markForfeited(): Deposit {
    if (this.status !== 'paid') {
      throw new DomainError('DEPOSIT_ALREADY_SETTLED', 'El anticipo no está pagado.');
    }
    return new Deposit(this.amount, 'forfeited');
  }
}
