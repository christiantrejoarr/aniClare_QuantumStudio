import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LiveController } from './live.controller';
import { LiveFeed } from './live-feed';
import { LiveInterceptor } from './live.interceptor';

@Module({
  controllers: [LiveController],
  providers: [LiveFeed, { provide: APP_INTERCEPTOR, useClass: LiveInterceptor }],
})
export class LiveModule {}
