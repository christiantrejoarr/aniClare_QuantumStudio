import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module';
import { CreateReservationUseCase } from './application/use-cases/create-reservation.use-case';
import { ConfirmReservationDepositUseCase } from './application/use-cases/confirm-reservation-deposit.use-case';
import { CancelReservationUseCase } from './application/use-cases/cancel-reservation.use-case';
import { JoinWaitlistUseCase } from './application/use-cases/join-waitlist.use-case';
import { GetReservationUseCase } from './application/use-cases/get-reservation.use-case';
import { ListAppointmentHistoryUseCase } from './application/use-cases/list-appointment-history.use-case';
import { ListAgendaUseCase } from './application/use-cases/list-agenda.use-case';
import { BOOKING_POLICY, BookingPolicy } from './domain/ports/booking-policy.port';
import { BOOKING_REPOSITORY, BookingRepository } from './domain/ports/booking-repository.port';
import { CLOCK, Clock } from './domain/ports/clock.port';
import { DEPOSIT_PAYMENT, DepositPayment } from './domain/ports/deposit-payment.port';
import { EVENT_PUBLISHER, EventPublisher } from './domain/ports/event-publisher.port';
import { SERVICE_CATALOG, ServiceCatalog } from './domain/ports/service-catalog.port';
import { CatalogModuleServiceCatalog } from './infrastructure/catalog/catalog-module.service-catalog';
import { SystemClock } from './infrastructure/clock/system-clock';
import { InProcessEventPublisher } from './infrastructure/messaging/in-process-event-publisher';
import { ReferenceDepositPayment } from './infrastructure/payments/reference-deposit.payment';
import { BookingSchemaInitializer } from './infrastructure/persistence/booking-schema.initializer';
import { ReservationOrmEntity } from './infrastructure/persistence/reservation.orm-entity';
import { TypeOrmBookingRepository } from './infrastructure/persistence/typeorm-booking.repository';
import { WaitlistOrmEntity } from './infrastructure/persistence/waitlist.orm-entity';
import { EnvBookingPolicy } from './infrastructure/policy/env-booking-policy';
import { BookingController } from './presentation/http/booking.controller';
import { BookingFacade } from './public/booking-facade';

@Module({
  imports: [CatalogModule, TypeOrmModule.forFeature([ReservationOrmEntity, WaitlistOrmEntity])],
  controllers: [BookingController],
  providers: [
    BookingSchemaInitializer,
    {
      provide: CreateReservationUseCase,
      useFactory: (
        catalog: ServiceCatalog,
        policies: BookingPolicy,
        repository: BookingRepository,
        deposits: DepositPayment,
        events: EventPublisher,
        clock: Clock,
      ) => new CreateReservationUseCase(catalog, policies, repository, deposits, events, clock),
      inject: [SERVICE_CATALOG, BOOKING_POLICY, BOOKING_REPOSITORY, DEPOSIT_PAYMENT, EVENT_PUBLISHER, CLOCK],
    },
    {
      provide: ConfirmReservationDepositUseCase,
      useFactory: (repository: BookingRepository, catalog: ServiceCatalog, events: EventPublisher, clock: Clock) =>
        new ConfirmReservationDepositUseCase(repository, catalog, events, clock),
      inject: [BOOKING_REPOSITORY, SERVICE_CATALOG, EVENT_PUBLISHER, CLOCK],
    },
    {
      provide: CancelReservationUseCase,
      useFactory: (repository: BookingRepository, catalog: ServiceCatalog, events: EventPublisher, clock: Clock) =>
        new CancelReservationUseCase(repository, catalog, events, clock),
      inject: [BOOKING_REPOSITORY, SERVICE_CATALOG, EVENT_PUBLISHER, CLOCK],
    },
    {
      provide: JoinWaitlistUseCase,
      useFactory: (catalog: ServiceCatalog, repository: BookingRepository, events: EventPublisher, clock: Clock) =>
        new JoinWaitlistUseCase(catalog, repository, events, clock),
      inject: [SERVICE_CATALOG, BOOKING_REPOSITORY, EVENT_PUBLISHER, CLOCK],
    },
    {
      provide: GetReservationUseCase,
      useFactory: (repository: BookingRepository, catalog: ServiceCatalog, clock: Clock) =>
        new GetReservationUseCase(repository, catalog, clock),
      inject: [BOOKING_REPOSITORY, SERVICE_CATALOG, CLOCK],
    },
    {
      provide: ListAppointmentHistoryUseCase,
      useFactory: (repository: BookingRepository, catalog: ServiceCatalog, clock: Clock) =>
        new ListAppointmentHistoryUseCase(repository, catalog, clock),
      inject: [BOOKING_REPOSITORY, SERVICE_CATALOG, CLOCK],
    },
    {
      provide: ListAgendaUseCase,
      useFactory: (repository: BookingRepository, catalog: ServiceCatalog, clock: Clock) =>
        new ListAgendaUseCase(repository, catalog, clock),
      inject: [BOOKING_REPOSITORY, SERVICE_CATALOG, CLOCK],
    },
    BookingFacade,
    CatalogModuleServiceCatalog,
    EnvBookingPolicy,
    TypeOrmBookingRepository,
    ReferenceDepositPayment,
    InProcessEventPublisher,
    SystemClock,
    { provide: SERVICE_CATALOG, useExisting: CatalogModuleServiceCatalog },
    { provide: BOOKING_POLICY, useExisting: EnvBookingPolicy },
    { provide: BOOKING_REPOSITORY, useExisting: TypeOrmBookingRepository },
    { provide: DEPOSIT_PAYMENT, useExisting: ReferenceDepositPayment },
    { provide: EVENT_PUBLISHER, useExisting: InProcessEventPublisher },
    { provide: CLOCK, useExisting: SystemClock },
  ],
  exports: [BookingFacade, InProcessEventPublisher],
})
export class BookingModule {}
