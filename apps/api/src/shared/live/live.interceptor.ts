import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { LiveFeed, liveTopic } from './live-feed';

const changing = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class LiveInterceptor implements NestInterceptor {
  constructor(private readonly feed: LiveFeed) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ method?: string; originalUrl?: string; url?: string }>();
    const topic = changing.has(request.method ?? '') ? liveTopic(request.originalUrl ?? request.url ?? '') : null;
    if (!topic) {
      return next.handle();
    }
    return next.handle().pipe(tap(() => this.feed.publish(topic)));
  }
}
