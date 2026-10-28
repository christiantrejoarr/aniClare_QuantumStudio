import { Reservation } from '../domain/entities/reservation';
import { WaitlistEntry } from '../domain/entities/waitlist-entry';
import { DomainEvent } from '../domain/events/domain-event';
import { BookingPolicy } from '../domain/ports/booking-policy.port';
import { BookingRepository } from '../domain/ports/booking-repository.port';
import { Clock } from '../domain/ports/clock.port';
import { DepositPayment } from '../domain/ports/deposit-payment.port';
import { EventPublisher } from '../domain/ports/event-publisher.port';
import { ServiceCatalog, ServiceOffering } from '../domain/ports/service-catalog.port';
import { CustomerId, ServiceId, TherapistId } from '../domain/value-objects/identifiers';
import { Money } from '../domain/value-objects/money';
import { CancellationPolicy } from '../domain/value-objects/cancellation-policy';
import { CancelReservationUseCase } from './use-cases/cancel-reservation.use-case';
import { ConfirmReservationDepositUseCase } from './use-cases/confirm-reservation-deposit.use-case';
import { CreateReservationUseCase } from './use-cases/create-reservation.use-case';
import { JoinWaitlistUseCase } from './use-cases/join-waitlist.use-case';

const MASAJE = '11111111-1111-4111-8111-111111111111';
const GRATIS = '44444444-4444-4444-8444-444444444444';
const THERAPIST = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CUSTOMER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CUSTOMER_B = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

class FakeClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return this.current;
  }

  advanceTo(next: Date): void {
    this.current = next;
  }
}

class FakeCatalog implements ServiceCatalog {
  constructor(private readonly offerings: ServiceOffering[]) {}

  async findById(id: ServiceId): Promise<ServiceOffering | null> {
    return this.offerings.find((item) => item.id.equals(id)) ?? null;
  }
}

class FakePolicy implements BookingPolicy {
  async current() {
    return { holdMinutes: 10, cancellation: CancellationPolicy.create(24, 0) };
  }
}

class FakeDeposits implements DepositPayment {
  async request(input: { reservationId: { value: string } }) {
    return { reference: `dep_${input.reservationId.value}` };
  }
}

class FakeEvents implements EventPublisher {
  readonly published: DomainEvent[] = [];

  async publish(events: DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }
}

class InMemoryBookingRepository implements BookingRepository {
  private readonly reservations: Reservation[] = [];
  private readonly waitlist: WaitlistEntry[] = [];

  async expirePendingHolds(now: Date): Promise<void> {
    for (const reservation of this.reservations) {
      reservation.expireHold(now);
    }
  }

  async saveReservation(reservation: Reservation): Promise<void> {
    this.upsert(reservation);
  }

  async saveReservationWithWaitlist(reservation: Reservation, entry: WaitlistEntry | null): Promise<void> {
    this.upsert(reservation);
    if (entry) {
      this.upsertWaitlist(entry);
    }
  }

  async saveWaitlist(entry: WaitlistEntry): Promise<void> {
    const duplicate = this.waitlist.find(
      (item) =>
        item.status === 'waiting' &&
        item.customerId.equals(entry.customerId) &&
        item.therapistId.equals(entry.therapistId) &&
        item.slot.startsAt.getTime() === entry.slot.startsAt.getTime() &&
        item.id.value !== entry.id.value,
    );
    if (duplicate) {
      throw new Error('duplicate');
    }
    this.upsertWaitlist(entry);
  }

  async findReservationById(id: { value: string }): Promise<Reservation | null> {
    return this.reservations.find((item) => item.id.value === id.value) ?? null;
  }

  async listReservationsByCustomer(customerId: CustomerId): Promise<Reservation[]> {
    return this.reservations.filter((item) => item.customerId.equals(customerId));
  }

  async listReservations(): Promise<Reservation[]> {
    return [...this.reservations].sort((left, right) => right.slot.startsAt.getTime() - left.slot.startsAt.getTime());
  }

  async findActiveOverlap(therapistId: TherapistId, slot: { overlaps(other: { startsAt: Date; endsAt: Date }): boolean }, now: Date) {
    return (
      this.reservations.find(
        (item) => item.therapistId.equals(therapistId) && item.holdsSlot(now) && item.slot.overlaps(slot as never),
      ) ?? null
    );
  }

  async findWaiting(customerId: CustomerId, therapistId: TherapistId, startsAt: Date) {
    return (
      this.waitlist.find(
        (item) =>
          item.status === 'waiting' &&
          item.customerId.equals(customerId) &&
          item.therapistId.equals(therapistId) &&
          item.slot.startsAt.getTime() === startsAt.getTime(),
      ) ?? null
    );
  }

  async findNextWaiting(therapistId: TherapistId, slot: { overlaps(other: { startsAt: Date; endsAt: Date }): boolean }) {
    return (
      this.waitlist
        .filter((item) => item.status === 'waiting' && item.therapistId.equals(therapistId) && item.slot.overlaps(slot as never))
        .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())[0] ?? null
    );
  }

  private upsert(reservation: Reservation): void {
    const index = this.reservations.findIndex((item) => item.id.value === reservation.id.value);
    if (index >= 0) {
      this.reservations[index] = reservation;
      return;
    }
    this.reservations.push(reservation);
  }

  private upsertWaitlist(entry: WaitlistEntry): void {
    const index = this.waitlist.findIndex((item) => item.id.value === entry.id.value);
    if (index >= 0) {
      this.waitlist[index] = entry;
      return;
    }
    this.waitlist.push(entry);
  }
}

function setup() {
  const clock = new FakeClock(new Date('2026-11-01T15:00:00.000Z'));
  const repository = new InMemoryBookingRepository();
  const events = new FakeEvents();
  const catalog = new FakeCatalog([
    {
      id: ServiceId.from(MASAJE),
      name: 'Masaje relajante',
      durationMinutes: 60,
      deposit: Money.mxn(30_000),
    },
    {
      id: ServiceId.from(GRATIS),
      name: 'Consulta de cortesía',
      durationMinutes: 30,
      deposit: Money.mxn(0),
    },
  ]);
  const create = new CreateReservationUseCase(catalog, new FakePolicy(), repository, new FakeDeposits(), events, clock);
  const confirm = new ConfirmReservationDepositUseCase(repository, catalog, events, clock);
  const cancel = new CancelReservationUseCase(repository, catalog, events, clock);
  const waitlist = new JoinWaitlistUseCase(catalog, repository, events, clock);
  return { clock, events, create, confirm, cancel, waitlist };
}

describe('Reservas', () => {
  const startsAt = new Date('2026-11-03T18:00:00.000Z');

  it('agenda con anticipo y referencia de pago', async () => {
    const { create, events } = setup();

    const view = await create.execute({
      customerId: CUSTOMER_A,
      serviceId: MASAJE,
      therapistId: THERAPIST,
      startsAt,
    });

    expect(view.status).toBe('pending_payment');
    expect(view.depositAmountCents).toBe(30_000);
    expect(view.paymentReference).toMatch(/^dep_/);
    expect(view.endsAt).toBe('2026-11-03T19:00:00.000Z');
    expect(events.published.map((event) => event.eventName)).toEqual(['booking.reservation.scheduled']);
  });

  it('confirma de inmediato un servicio sin anticipo', async () => {
    const { create } = setup();

    const view = await create.execute({
      customerId: CUSTOMER_A,
      serviceId: GRATIS,
      therapistId: THERAPIST,
      startsAt,
    });

    expect(view.status).toBe('confirmed');
    expect(view.depositStatus).toBe('waived');
  });

  it('manda a lista de espera cuando la terapeuta ya está ocupada', async () => {
    const { create, waitlist } = setup();
    await create.execute({ customerId: CUSTOMER_A, serviceId: MASAJE, therapistId: THERAPIST, startsAt });

    await expect(
      create.execute({ customerId: CUSTOMER_B, serviceId: MASAJE, therapistId: THERAPIST, startsAt }),
    ).rejects.toMatchObject({ code: 'SLOT_SATURATED' });

    const entry = await waitlist.execute({
      customerId: CUSTOMER_B,
      serviceId: MASAJE,
      therapistId: THERAPIST,
      startsAt,
    });
    expect(entry.status).toBe('waiting');
  });

  it('no abre lista de espera si el horario sigue libre', async () => {
    const { waitlist } = setup();

    await expect(
      waitlist.execute({ customerId: CUSTOMER_B, serviceId: MASAJE, therapistId: THERAPIST, startsAt }),
    ).rejects.toMatchObject({ code: 'SLOT_STILL_AVAILABLE' });
  });

  it('confirma el anticipo y, al cancelar con tiempo, pide el reembolso y avisa a la lista', async () => {
    const { create, confirm, cancel, waitlist, events } = setup();
    const created = await create.execute({
      customerId: CUSTOMER_A,
      serviceId: MASAJE,
      therapistId: THERAPIST,
      startsAt,
    });
    await waitlist.execute({ customerId: CUSTOMER_B, serviceId: MASAJE, therapistId: THERAPIST, startsAt });

    const confirmed = await confirm.execute({ reservationId: created.reservationId });
    expect(confirmed.status).toBe('confirmed');

    const cancelled = await cancel.execute({ reservationId: created.reservationId });

    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.refundPercent).toBe(100);
    expect(cancelled.depositStatus).toBe('refund_due');
    expect(cancelled.waitlistNotifiedEntryId).toEqual(expect.any(String));
    expect(events.published.map((event) => event.eventName)).toContain('booking.waitlist.spot-opened');
  });

  it('impide confirmar un apartado vencido', async () => {
    const { create, confirm, clock } = setup();
    const created = await create.execute({
      customerId: CUSTOMER_A,
      serviceId: MASAJE,
      therapistId: THERAPIST,
      startsAt,
    });

    clock.advanceTo(new Date('2026-11-01T15:11:00.000Z'));

    await expect(confirm.execute({ reservationId: created.reservationId })).rejects.toMatchObject({
      code: 'HOLD_EXPIRED',
    });
  });
});
