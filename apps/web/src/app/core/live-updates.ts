import { Injectable } from '@angular/core';
import { Observable, Subject, auditTime, filter } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LiveUpdates {
  private readonly events = new Subject<string>();

  constructor() {
    if (typeof EventSource === 'undefined') {
      return;
    }
    const source = new EventSource(`${environment.apiUrl}/live`);
    source.onmessage = (event) => {
      if (typeof event.data === 'string' && event.data.length > 0) {
        this.events.next(event.data);
      }
    };
  }

  changes(topics: string[]): Observable<string> {
    return this.events.pipe(
      filter((topic) => topics.includes(topic)),
      auditTime(250),
    );
  }
}
