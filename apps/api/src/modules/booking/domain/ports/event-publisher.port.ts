import { DomainEvent } from '../events/domain-event';

export interface EventPublisher {
  publish(events: DomainEvent[]): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
