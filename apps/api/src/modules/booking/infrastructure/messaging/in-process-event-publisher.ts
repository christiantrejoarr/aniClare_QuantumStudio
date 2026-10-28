import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent } from '../../domain/events/domain-event';
import { EventPublisher } from '../../domain/ports/event-publisher.port';

@Injectable()
export class InProcessEventPublisher implements EventPublisher {
  private readonly logger = new Logger(InProcessEventPublisher.name);
  private readonly handlers: Array<(event: DomainEvent) => Promise<void> | void> = [];

  subscribe(handler: (event: DomainEvent) => Promise<void> | void): void {
    this.handlers.push(handler);
  }

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      this.logger.log(`${event.eventName} ${JSON.stringify(event.payload)}`);
      for (const handler of this.handlers) {
        await handler(event);
      }
    }
  }
}
