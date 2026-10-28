import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonDatetime,
  IonHeader,
  IonItem,
  IonLabel,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { BookingApi, ReservationView } from '../core/booking-api';
import { CatalogApi } from '../core/catalog-api';
import { formatPesos, SpaService, therapists } from '../core/catalog';
import { guestCustomerId } from '../core/guest-id';

@Component({
  selector: 'app-reserve',
  templateUrl: 'reserve.page.html',
  styleUrls: ['reserve.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonButton,
    IonNote,
  ],
})
export class ReservePage {
  private readonly api = inject(BookingApi);
  private readonly catalog = inject(CatalogApi);
  readonly services = signal<SpaService[]>([]);
  readonly therapists = therapists;
  readonly formatPesos = formatPesos;
  readonly minStart = new Date().toISOString();
  readonly serviceId = signal('');
  readonly therapistId = signal(therapists[0].id);
  readonly startsAt = signal(defaultStart());
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly confirmation = signal<ReservationView | null>(null);

  ionViewWillEnter(): void {
    this.catalog.list().subscribe({
      next: (services) => {
        this.services.set(services);
        if (!services.some((service) => service.id === this.serviceId()) && services[0]) {
          this.serviceId.set(services[0].id);
        }
      },
      error: () => this.errorMessage.set('No pudimos cargar el catálogo.'),
    });
  }

  onService(event: CustomEvent<{ value?: string }>): void {
    if (typeof event.detail.value === 'string') {
      this.serviceId.set(event.detail.value);
    }
  }

  onTherapist(event: CustomEvent<{ value?: string }>): void {
    if (typeof event.detail.value === 'string') {
      this.therapistId.set(event.detail.value);
    }
  }

  onStart(event: CustomEvent<{ value?: string | string[] | null }>): void {
    const value = event.detail.value;
    if (typeof value === 'string') {
      this.startsAt.set(value);
    }
  }

  submit(): void {
    this.submitting.set(true);
    this.errorMessage.set(null);
    this.confirmation.set(null);
    this.api
      .create({
        customerId: guestCustomerId(),
        serviceId: this.serviceId(),
        therapistId: this.therapistId(),
        startsAt: new Date(this.startsAt()).toISOString(),
      })
      .subscribe({
        next: (reservation) => {
          this.confirmation.set(reservation);
          this.submitting.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.errorMessage.set(
            typeof message === 'string' ? message : 'No pudimos completar la reserva.',
          );
          this.submitting.set(false);
        },
      });
  }
}

function defaultStart(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return toLocalIso(date);
}

function toLocalIso(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const offset = `${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00${offset}`;
}
