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

export interface AdminSession {
  token: string;
}

export interface AdminUser {
  id: string;
  username: string;
  role: 'admin';
  createdAt: string;
}

export interface AdminTherapist {
  id: string;
  givenName: string;
  familyName: string;
  name: string;
}

export interface WorkingHours {
  opensAt: string;
  closesAt: string;
  sunday: boolean;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  allowWeekends: boolean;
  allowHolidays: boolean;
  allowHalfDays: boolean;
  days: SpecialDay[];
}

export interface SpecialDay {
  day: string;
  kind: 'holiday' | 'half_day';
  opensAt: string | null;
  closesAt: string | null;
}

export type WorkingHoursDraft = Omit<WorkingHours, 'days'>;

export interface SpecialDayDraft {
  day: string;
  kind: 'holiday' | 'half_day';
  opensAt?: string;
  closesAt?: string;
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

  openSession(username: string, password: string): Observable<AdminSession> {
    return this.http.post<AdminSession>(`${environment.apiUrl}/admin/session`, { username, password });
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

  createService(body: ReviseServiceBody): Observable<ManagedService> {
    return this.http.post<ManagedService>(`${environment.apiUrl}/admin/services`, body, { headers: this.headers() });
  }

  removeService(serviceId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/services/${serviceId}`, { headers: this.headers() });
  }

  attend(reservationId: string): Observable<ReservationView> {
    return this.http.post<ReservationView>(`${environment.apiUrl}/admin/reservations/${reservationId}/attend`, {}, {
      headers: this.headers(),
    });
  }

  cancelReservation(reservationId: string): Observable<ReservationView> {
    return this.http.post<ReservationView>(`${environment.apiUrl}/admin/reservations/${reservationId}/cancel`, {}, {
      headers: this.headers(),
    });
  }

  users(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${environment.apiUrl}/admin/users`, { headers: this.headers() });
  }

  createUser(username: string, password: string): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${environment.apiUrl}/admin/users`, { username, password }, { headers: this.headers() });
  }

  reviseUser(id: string, username: string, password?: string): Observable<AdminUser> {
    return this.http.patch<AdminUser>(
      `${environment.apiUrl}/admin/users/${id}`,
      password ? { username, password } : { username },
      { headers: this.headers() },
    );
  }

  removeUser(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/users/${id}`, { headers: this.headers() });
  }

  therapists(): Observable<AdminTherapist[]> {
    return this.http.get<AdminTherapist[]>(`${environment.apiUrl}/admin/therapists`, { headers: this.headers() });
  }

  createTherapist(givenName: string, familyName: string): Observable<AdminTherapist> {
    return this.http.post<AdminTherapist>(
      `${environment.apiUrl}/admin/therapists`,
      { givenName, familyName },
      { headers: this.headers() },
    );
  }

  reviseTherapist(id: string, givenName: string, familyName: string): Observable<AdminTherapist> {
    return this.http.patch<AdminTherapist>(
      `${environment.apiUrl}/admin/therapists/${id}`,
      { givenName, familyName },
      { headers: this.headers() },
    );
  }

  removeTherapist(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/therapists/${id}`, { headers: this.headers() });
  }

  workingHours(): Observable<WorkingHours> {
    return this.http.get<WorkingHours>(`${environment.apiUrl}/admin/working-hours`, { headers: this.headers() });
  }

  saveWorkingHours(body: WorkingHoursDraft): Observable<WorkingHours> {
    return this.http.put<WorkingHours>(`${environment.apiUrl}/admin/working-hours`, body, { headers: this.headers() });
  }

  addSpecialDay(body: SpecialDayDraft): Observable<WorkingHours> {
    return this.http.post<WorkingHours>(`${environment.apiUrl}/admin/working-hours/days`, body, { headers: this.headers() });
  }

  removeSpecialDay(day: string): Observable<WorkingHours> {
    return this.http.delete<WorkingHours>(`${environment.apiUrl}/admin/working-hours/days/${day}`, { headers: this.headers() });
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.token()}` });
  }
}

