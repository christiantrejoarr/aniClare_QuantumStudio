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
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'expired';
  depositAmountCents: number;
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
}
