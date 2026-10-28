import { DomainError } from '../errors/domain-error';

export class CancellationPolicy {
  private constructor(
    readonly noticeHours: number,
    readonly lateRefundPercent: number,
  ) {}

  static create(noticeHours: number, lateRefundPercent: number): CancellationPolicy {
    if (!Number.isInteger(noticeHours) || noticeHours < 0) {
      throw new DomainError('INVALID_POLICY', 'La anticipación de la política de cancelación no es válida.');
    }
    if (!Number.isInteger(lateRefundPercent) || lateRefundPercent < 0 || lateRefundPercent > 100) {
      throw new DomainError('INVALID_POLICY', 'El porcentaje de reembolso no es válido.');
    }
    return new CancellationPolicy(noticeHours, lateRefundPercent);
  }

  refundPercentFor(startsAt: Date, cancelledAt: Date): number {
    const remainingMs = startsAt.getTime() - cancelledAt.getTime();
    if (remainingMs >= this.noticeHours * 3_600_000) {
      return 100;
    }
    return this.lateRefundPercent;
  }
}
