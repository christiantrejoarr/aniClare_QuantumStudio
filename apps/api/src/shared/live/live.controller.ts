import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { LiveFeed } from './live-feed';

@Controller()
export class LiveController {
  constructor(private readonly feed: LiveFeed) {}

  @Get('live')
  stream(@Res() response: Response): void {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');
    response.write(': connected\n\n');
    if (typeof response.flushHeaders === 'function') {
      response.flushHeaders();
    }

    const subscription = this.feed.stream().subscribe((topic) => {
      response.write(`data: ${topic}\n\n`);
    });
    const beat = setInterval(() => response.write(': ping\n\n'), 25_000);
    response.on('close', () => {
      clearInterval(beat);
      subscription.unsubscribe();
    });
  }
}
