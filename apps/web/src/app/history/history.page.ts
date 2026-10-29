import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent, IonTitle, IonToolbar } from '@ionic/angular';

import { BookingApi, ReservationView } from '../core/booking-api';
import { formatPesos, SpaTherapist } from '../core/catalog';
import { guestCustomerId } from '../core/guest-id';
import { TherapistApi } from '../core/therapist-api';

const statusLabel: Record<ReservationView['status'], string> = {
  pending_payment: 'Esperando anticipo',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  expired: 'Apartado vencido',
  attended: 'Atendida',
};

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent, DatePipe],
})
export class HistoryPage {
  private readonly api = inject(BookingApi);
  private readonly therapistApi = inject(TherapistApi);
  readonly formatPesos = formatPesos;
  readonly statusLabel = statusLabel;
  readonly reservations = signal<ReservationView[]>([]);
  readonly therapists = signal<SpaTherapist[]>([]);
  readonly errorMessage = signal<string | null>(null);

  ionViewWillEnter(): void {
    this.therapistApi.list().subscribe({
      next: (therapists) => this.therapists.set(therapists),
    });
    this.load();
  }

  therapistName(id: string): string {
    return this.therapists().find((therapist) => therapist.id === id)?.name ?? 'Terapeuta';
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
