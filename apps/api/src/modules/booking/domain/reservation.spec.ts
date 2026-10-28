import { CancellationPolicy } from './value-objects/cancellation-policy';
import { Money } from './value-objects/money';
import { CustomerId, ReservationId, ServiceId, TherapistId } from './value-objects/identifiers';
import { TimeSlot } from './value-objects/time-slot';
import { Reservation } from './entities/reservation';
import { DomainError } from './errors/domain-error';

const customerId = CustomerId.from('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
const serviceId = ServiceId.from('11111111-1111-4111-8111-111111111111');
const therapistId = TherapistId.from('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
const policy = CancellationPolicy.create(24, 0);

function schedule(startsAt: Date, now: Date, depositCents = 30_000): Reservation {
  return Reservation.schedule({
    id: ReservationId.generate(),
    customerId,
    serviceId,
    therapistId,
    slot: TimeSlot.fromStartAndDuration(startsAt, 60),
    depositAmount: Money.mxn(depositCents),
    policy,
    paymentReference: depositCents === 0 ? null : 'dep_test',
    now,
    holdMinutes: 10,
  });
}

describe('Reservation', () => {
  const now = new Date('2026-11-01T15:00:00.000Z');

  it('aparta la cita hasta que llega el anticipo', () => {
    const reservation = schedule(new Date('2026-11-03T18:00:00.000Z'), now);

    expect(reservation.status).toBe('pending_payment');
    expect(reservation.deposit.status).toBe('pending');
    expect(reservation.holdExpiresAt?.toISOString()).toBe('2026-11-01T15:10:00.000Z');
  });

  it('confirma sin cobro cuando el anticipo es cero', () => {
    const reservation = schedule(new Date('2026-11-03T18:00:00.000Z'), now, 0);

    expect(reservation.status).toBe('confirmed');
    expect(reservation.deposit.status).toBe('waived');
    expect(reservation.paymentReference).toBeNull();
  });

  it('rechaza un horario que ya empezó', () => {
    expect(() => schedule(new Date('2026-11-01T15:00:00.000Z'), now)).toThrow(DomainError);
  });

  it('devuelve el anticipo completo fuera de la ventana y lo retiene dentro', () => {
    const early = schedule(new Date('2026-11-03T18:00:00.000Z'), now);
    early.confirmDeposit(now);
    expect(early.cancel(new Date('2026-11-02T17:00:00.000Z')).refundPercent).toBe(100);
    expect(early.deposit.status).toBe('refund_due');

    const late = schedule(new Date('2026-11-03T18:00:00.000Z'), now);
    late.confirmDeposit(now);
    expect(late.cancel(new Date('2026-11-03T17:30:00.000Z')).refundPercent).toBe(0);
    expect(late.deposit.status).toBe('forfeited');
  });

  it('vence el apartado cuando se acaba el tiempo de pago', () => {
    const reservation = schedule(new Date('2026-11-03T18:00:00.000Z'), now);

    expect(reservation.expireHold(new Date('2026-11-01T15:10:00.000Z'))).toBe(true);
    expect(reservation.status).toBe('expired');
    expect(() => reservation.confirmDeposit(new Date('2026-11-01T15:11:00.000Z'))).toThrow(
      expect.objectContaining({ code: 'HOLD_EXPIRED' }),
    );
  });
});
