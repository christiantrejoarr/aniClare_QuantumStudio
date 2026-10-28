import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent, IonTitle, IonToolbar } from '@ionic/angular';

import { BookingApi, ReservationView } from '../core/booking-api';
import { formatPesos } from '../core/catalog';
import { guestCustomerId } from '../core/guest-id';

const statusLabel: Record<ReservationView['status'], string> = {
  pending_payment: 'Esperando anticipo',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  expired: 'Apartado vencido',
};

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent, DatePipe],
})
export class HistoryPage {
  private readonly api = inject(BookingApi);
  readonly formatPesos = formatPesos;
  readonly statusLabel = statusLabel;
  readonly reservations = signal<ReservationView[]>([]);
  readonly errorMessage = signal<string | null>(null);

  ionViewWillEnter(): void {
    this.load();
  }

  load(event?: CustomEvent): void {
    this.api.history(guestCustomerId()).subscribe({
      next: (reservations) => {
        this.reservations.set(reservations);
        this.errorMessage.set(null);
        this.finish(event);
      },
      error: (error: HttpErrorResponse) => {
        const message = error.error?.message;
        this.errorMessage.set(typeof message === 'string' ? message : 'No pudimos cargar tu historial.');
        this.finish(event);
      },
    });
  }

  private finish(event?: CustomEvent): void {
    const target = event?.target as { complete?: () => void } | undefined;
    target?.complete?.();
  }
}
