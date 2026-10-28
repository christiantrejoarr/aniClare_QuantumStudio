import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ReservationView } from './booking-api';

export interface ManagedService {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  depositCents: number;
  currency: 'MXN';
  active: boolean;
}

export interface ReviseServiceBody {
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  depositCents: number;
  active: boolean;
}

const TOKEN_KEY = 'aniclare.adminToken';

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);

  token(): string {
    return sessionStorage.getItem(TOKEN_KEY) ?? '';
  }

  remember(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  forget(): void {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  reservations(): Observable<ReservationView[]> {
    return this.http.get<ReservationView[]>(`${environment.apiUrl}/admin/reservations`, { headers: this.headers() });
  }

  services(): Observable<ManagedService[]> {
    return this.http.get<ManagedService[]>(`${environment.apiUrl}/admin/services`, { headers: this.headers() });
  }

  revise(serviceId: string, body: ReviseServiceBody): Observable<ManagedService> {
    return this.http.patch<ManagedService>(`${environment.apiUrl}/admin/services/${serviceId}`, body, {
      headers: this.headers(),
    });
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.token()}` });
  }
}
