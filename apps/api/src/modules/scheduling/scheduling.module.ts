import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SchedulingJournal } from './infrastructure/persistence/scheduling-journal';
import { SchedulingRoster } from './infrastructure/persistence/scheduling-roster';
import { SchedulingSchemaInitializer } from './infrastructure/persistence/scheduling-schema.initializer';
import { SchedulingController } from './presentation/http/scheduling.controller';
import { SchedulingFacade } from './public/scheduling-facade';

@Module({
  controllers: [SchedulingController],
  providers: [
    {
      provide: SchedulingRoster,
      useFactory: (dataSource: DataSource) => new SchedulingRoster(dataSource),
      inject: [DataSource],
    },
    {
      provide: SchedulingJournal,
      useFactory: (dataSource: DataSource) => new SchedulingJournal(dataSource),
      inject: [DataSource],
    },
    SchedulingSchemaInitializer,
    {
      provide: SchedulingFacade,
      useFactory: (roster: SchedulingRoster, journal: SchedulingJournal) => new SchedulingFacade(roster, journal),
      inject: [SchedulingRoster, SchedulingJournal],
    },
  ],
  exports: [SchedulingFacade],
})
export class SchedulingModule {}
