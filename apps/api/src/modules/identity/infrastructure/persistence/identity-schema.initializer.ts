import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { IdentityAccounts } from './identity-accounts';

@Injectable()
export class IdentitySchemaInitializer implements OnModuleInit {
  private readonly logger = new Logger(IdentitySchemaInitializer.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly accounts: IdentityAccounts,
  ) {}

  async onModuleInit(): Promise<void> {
    const sql = readFileSync(join(__dirname, 'sql', '001_identity.sql'), 'utf8');
    await this.dataSource.query(sql);
    const username = (this.config.get<string>('ADMIN_USERNAME') || 'admin').trim() || 'admin';
    const password = this.config.get<string>('ADMIN_PASSWORD') || 'change-me-local-only';
    await this.accounts.ensureAdmin(username, password);
    this.logger.log(`Cuenta de administración lista: ${username}`);
  }
}
