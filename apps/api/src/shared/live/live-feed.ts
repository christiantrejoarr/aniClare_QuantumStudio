import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

import { liveTopic } from './live-topic';

export { liveTopic };

@Injectable()
export class LiveFeed {
  private readonly events = new Subject<string>();

  publish(topic: string): void {
    this.events.next(topic);
  }

  stream(): Observable<string> {
    return this.events.asObservable();
  }
}
