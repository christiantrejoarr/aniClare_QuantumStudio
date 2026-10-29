import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface ReservationView {
  reservationId: string;
  customerId: string;
  serviceId: string;
  serviceName: string | null;
  therapistId: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'expired' | 'attended';
  depositAmountCents: number;
  priceCents: number | null;
  depositCurrency: 'MXN';
  depositStatus: 'pending' | 'paid' | 'waived' | 'refund_due' | 'forfeited';
  paymentReference: string | null;
}

export interface ScheduleReservationBody {
  customerId: string;
  serviceId: string;
  therapistId: string;
  startsAt: string;
}

@Injectable({ providedIn: 'root' })
export class BookingApi {
  private readonly http = inject(HttpClient);

  create(body: ScheduleReservationBody): Observable<ReservationView> {
    return this.http.post<ReservationView>(`${environment.apiUrl}/reservations`, body);
  }

  history(customerId: string): Observable<ReservationView[]> {
    return this.http.get<ReservationView[]>(`${environment.apiUrl}/customers/${customerId}/reservations`);
  }

  availability(therapistId: string, serviceId: string, from: string, to: string): Observable<OpenDay[]> {
    const query = new URLSearchParams({ therapistId, serviceId, from, to });
    return this.http.get<OpenDay[]>(`${environment.apiUrl}/availability?${query.toString()}`);
  }
}

export interface OpenDay {
  date: string;
  hours: string[];
}
