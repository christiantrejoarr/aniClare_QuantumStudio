import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { SpaService } from './catalog';

@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly http = inject(HttpClient);

  list(): Observable<SpaService[]> {
    return this.http.get<SpaService[]>(`${environment.apiUrl}/services`);
  }
}
