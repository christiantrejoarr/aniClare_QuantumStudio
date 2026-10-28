import { Column, Entity, PrimaryColumn } from 'typeorm';
import { WaitlistStatus } from '../../domain/entities/waitlist-entry';

@Entity({ schema: 'booking', name: 'waitlist_entries' })
export class WaitlistOrmEntity {
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
  status!: WaitlistStatus;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'notified_at', type: 'timestamptz', nullable: true })
  notifiedAt!: Date | null;
}
