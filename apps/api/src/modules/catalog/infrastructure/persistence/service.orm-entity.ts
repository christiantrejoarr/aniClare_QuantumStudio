import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'catalog', name: 'services' })
export class ServiceOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes!: number;

  @Column({ name: 'price_cents', type: 'int' })
  priceCents!: number;

  @Column({ name: 'deposit_cents', type: 'int' })
  depositCents!: number;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ type: 'boolean' })
  active!: boolean;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
