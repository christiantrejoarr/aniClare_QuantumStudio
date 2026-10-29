import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IdentityAccounts } from './infrastructure/persistence/identity-accounts';
import { IdentitySchemaInitializer } from './infrastructure/persistence/identity-schema.initializer';
import { IdentityFacade } from './public/identity-facade';

@Module({
  providers: [
    {
      provide: IdentityAccounts,
      useFactory: (dataSource: DataSource) => new IdentityAccounts(dataSource),
      inject: [DataSource],
    },
    IdentitySchemaInitializer,
    {
      provide: IdentityFacade,
      useFactory: (accounts: IdentityAccounts) => new IdentityFacade(accounts),
      inject: [IdentityAccounts],
    },
  ],
  exports: [IdentityFacade],
})
export class IdentityModule {}
