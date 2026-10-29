import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { SpaTherapist } from './catalog';

@Injectable({ providedIn: 'root' })
export class TherapistApi {
  private readonly http = inject(HttpClient);

  list(): Observable<SpaTherapist[]> {
    return this.http.get<SpaTherapist[]>(`${environment.apiUrl}/therapists`);
  }
}
