import { Column, Entity, PrimaryColumn } from 'typeorm';
import { DepositStatus } from '../../domain/value-objects/deposit';
import { ReservationStatus } from '../../domain/entities/reservation';

@Entity({ schema: 'booking', name: 'reservations' })
export class ReservationOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId!: string;

  @Column({ name: 'therapist_id', type: 'uuid' })
  therapistId!: string;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt!: Date;

  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt!: Date;

  @Column({ type: 'text' })
  status!: ReservationStatus;

  @Column({ name: 'deposit_amount_cents', type: 'int' })
  depositAmountCents!: number;

  @Column({ name: 'deposit_currency', type: 'char', length: 3 })
  depositCurrency!: string;

  @Column({ name: 'deposit_status', type: 'text' })
  depositStatus!: DepositStatus;

  @Column({ name: 'cancellation_notice_hours', type: 'int' })
  cancellationNoticeHours!: number;

  @Column({ name: 'cancellation_late_refund_percent', type: 'int' })
  cancellationLateRefundPercent!: number;

  @Column({ name: 'payment_reference', type: 'text', nullable: true })
  paymentReference!: string | null;

  @Column({ name: 'hold_expires_at', type: 'timestamptz', nullable: true })
  holdExpiresAt!: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
