import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Reservation } from '../../domain/entities/reservation';
import { WaitlistEntry } from '../../domain/entities/waitlist-entry';
import { DomainError } from '../../domain/errors/domain-error';
import { BookingRepository } from '../../domain/ports/booking-repository.port';
import { CustomerId, ReservationId, TherapistId } from '../../domain/value-objects/identifiers';
import { TimeSlot } from '../../domain/value-objects/time-slot';
import { reservationToDomain, reservationToOrm } from './reservation.mapper';
import { ReservationOrmEntity } from './reservation.orm-entity';
import { waitlistToDomain, waitlistToOrm } from './waitlist.mapper';
import { WaitlistOrmEntity } from './waitlist.orm-entity';

function pgCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  const candidate = error as { code?: unknown; driverError?: { code?: unknown } };
  if (typeof candidate.driverError?.code === 'string') {
    return candidate.driverError.code;
  }
  if (typeof candidate.code === 'string') {
    return candidate.code;
  }
  return undefined;
}

@Injectable()
export class TypeOrmBookingRepository implements BookingRepository {
  constructor(private readonly dataSource: DataSource) {}

  async expirePendingHolds(now: Date): Promise<void> {
    await this.expire(this.dataSource.manager, now);
  }

  async saveReservation(reservation: Reservation): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.expire(manager, reservation.updatedAt);
      await this.persistReservation(manager, reservation);
    });
  }

  async saveReservationWithWaitlist(reservation: Reservation, entry: WaitlistEntry | null): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.expire(manager, reservation.updatedAt);
      await this.persistReservation(manager, reservation);
      if (entry) {
        await this.persistWaitlist(manager, entry);
      }
    });
  }

  async saveWaitlist(entry: WaitlistEntry): Promise<void> {
    await this.persistWaitlist(this.dataSource.manager, entry);
  }

  async findReservationById(id: ReservationId): Promise<Reservation | null> {
    const row = await this.dataSource.getRepository(ReservationOrmEntity).findOne({ where: { id: id.value } });
    return row ? reservationToDomain(row) : null;
  }

  async listReservationsByCustomer(customerId: CustomerId): Promise<Reservation[]> {
    const rows = await this.dataSource.getRepository(ReservationOrmEntity).find({
      where: { customerId: customerId.value },
      order: { startsAt: 'DESC' },
    });
    return rows.map(reservationToDomain);
  }

  async listReservations(): Promise<Reservation[]> {
    const rows = await this.dataSource.getRepository(ReservationOrmEntity).find({
      order: { startsAt: 'DESC' },
    });
    return rows.map(reservationToDomain);
  }

  async findActiveOverlap(therapistId: TherapistId, slot: TimeSlot, now: Date): Promise<Reservation | null> {
    const row = await this.dataSource
      .getRepository(ReservationOrmEntity)
      .createQueryBuilder('reservation')
      .where('reservation.therapistId = :therapistId', { therapistId: therapistId.value })
      .andWhere('reservation.startsAt < :endsAt AND reservation.endsAt > :startsAt', {
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
      })
      .andWhere(
        '(reservation.status = :confirmed OR (reservation.status = :pending AND reservation.holdExpiresAt > :now))',
        { confirmed: 'confirmed', pending: 'pending_payment', now },
      )
      .getOne();
    return row ? reservationToDomain(row) : null;
  }

  async findWaiting(
    customerId: CustomerId,
    therapistId: TherapistId,
    startsAt: Date,
  ): Promise<WaitlistEntry | null> {
    const row = await this.dataSource.getRepository(WaitlistOrmEntity).findOne({
      where: {
        customerId: customerId.value,
        therapistId: therapistId.value,
        startsAt,
        status: 'waiting',
      },
    });
    return row ? waitlistToDomain(row) : null;
  }

  async findNextWaiting(therapistId: TherapistId, slot: TimeSlot): Promise<WaitlistEntry | null> {
    const row = await this.dataSource
      .getRepository(WaitlistOrmEntity)
      .createQueryBuilder('entry')
      .where('entry.therapistId = :therapistId', { therapistId: therapistId.value })
      .andWhere('entry.status = :status', { status: 'waiting' })
      .andWhere('entry.startsAt < :endsAt AND entry.endsAt > :startsAt', {
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
      })
      .orderBy('entry.createdAt', 'ASC')
      .getOne();
    return row ? waitlistToDomain(row) : null;
  }

  private async expire(manager: EntityManager, now: Date): Promise<void> {
    await manager.query(
      `UPDATE booking.reservations
       SET status = 'expired', updated_at = $1
       WHERE status = 'pending_payment' AND hold_expires_at <= $1`,
      [now],
    );
  }

  private async persistReservation(manager: EntityManager, reservation: Reservation): Promise<void> {
    try {
      await manager.getRepository(ReservationOrmEntity).save(reservationToOrm(reservation));
    } catch (error) {
      if (pgCode(error) === '23P01') {
        throw new DomainError(
          'SLOT_SATURATED',
          'Ese horario ya está ocupado. Puedes entrar a la lista de espera.',
        );
      }
      throw error;
    }
  }

  private async persistWaitlist(manager: EntityManager, entry: WaitlistEntry): Promise<void> {
    try {
      await manager.getRepository(WaitlistOrmEntity).save(waitlistToOrm(entry));
    } catch (error) {
      if (pgCode(error) === '23505') {
        throw new DomainError('ALREADY_ON_WAITLIST', 'Ya estás en la lista de espera de ese horario.');
      }
      throw error;
    }
  }
}
