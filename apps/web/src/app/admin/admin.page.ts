import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular';

import { AdminApi, ManagedService } from '../core/admin-api';
import { ReservationView } from '../core/booking-api';
import { formatPesos, therapists } from '../core/catalog';

interface ServiceDraft {
  id: string;
  name: string;
  description: string;
  durationMinutes: string;
  pricePesos: string;
  depositPesos: string;
  active: boolean;
  saving: boolean;
  message: string | null;
}

const statusLabel: Record<ReservationView['status'], string> = {
  pending_payment: 'Esperando anticipo',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  expired: 'Apartado vencido',
};

@Component({
  selector: 'app-admin',
  templateUrl: 'admin.page.html',
  styleUrls: ['admin.page.scss'],
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonInput,
    IonTextarea,
    IonToggle,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
})
export class AdminPage {
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  readonly formatPesos = formatPesos;
  readonly statusLabel = statusLabel;
  readonly authenticated = signal(false);
  readonly accessKey = signal('');
  readonly section = signal<'reservas' | 'servicios'>('reservas');
  readonly reservations = signal<ReservationView[]>([]);
  readonly drafts = signal<ServiceDraft[]>([]);
  readonly errorMessage = signal<string | null>(null);
  readonly loading = signal(false);

  ionViewWillEnter(): void {
    if (!this.api.token()) {
      this.authenticated.set(false);
      return;
    }
    this.authenticated.set(true);
    this.load();
  }

  onKey(event: { detail: { value?: string | number | null } }): void {
    this.accessKey.set(String(event.detail.value ?? ''));
  }

  enter(): void {
    const token = this.accessKey().trim();
    if (!token) {
      this.errorMessage.set('Escribe la clave de administración.');
      return;
    }
    this.api.remember(token);
    this.authenticated.set(true);
    this.load();
  }

  leave(): void {
    this.api.forget();
    this.authenticated.set(false);
    this.accessKey.set('');
    this.reservations.set([]);
    this.drafts.set([]);
    this.errorMessage.set(null);
  }

  backHome(): void {
    void this.router.navigate(['/home']);
  }

  onSection(event: { detail: { value?: string | number } }): void {
    const value = event.detail.value;
    if (value === 'reservas' || value === 'servicios') {
      this.section.set(value);
    }
  }

  therapistName(id: string): string {
    return therapists.find((therapist) => therapist.id === id)?.name ?? 'Terapeuta';
  }

  onDraft(
    draft: ServiceDraft,
    field: 'name' | 'description' | 'durationMinutes' | 'pricePesos' | 'depositPesos',
    event: { detail: { value?: string | number | null } },
  ): void {
    draft[field] = String(event.detail.value ?? '');
    draft.message = null;
  }

  onActive(draft: ServiceDraft, event: { detail: { checked: boolean } }): void {
    draft.active = event.detail.checked;
    draft.message = null;
  }

  save(draft: ServiceDraft): void {
    const body = this.toBody(draft);
    if (!body) {
      return;
    }
    draft.saving = true;
    draft.message = null;
    this.drafts.set([...this.drafts()]);
    this.api.revise(draft.id, body).subscribe({
      next: (service) => {
        this.applyService(draft, service, 'Servicio actualizado. Las citas nuevas usan este precio.');
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.leave();
          this.errorMessage.set('La clave de administración no es válida.');
          return;
        }
        draft.saving = false;
        draft.message = this.readError(error, 'No pudimos guardar el servicio.');
        this.drafts.set([...this.drafts()]);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    forkJoin({
      reservations: this.api.reservations(),
      services: this.api.services(),
    }).subscribe({
      next: ({ reservations, services }) => {
        this.reservations.set(reservations);
        this.drafts.set(services.map((service) => this.toDraft(service)));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        if (error.status === 401) {
          this.leave();
          this.errorMessage.set('La clave de administración no es válida.');
          return;
        }
        this.errorMessage.set(this.readError(error, 'No pudimos abrir el panel.'));
      },
    });
  }

  private toDraft(service: ManagedService): ServiceDraft {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: String(service.durationMinutes),
      pricePesos: String(service.priceCents / 100),
      depositPesos: String(service.depositCents / 100),
      active: service.active,
      saving: false,
      message: null,
    };
  }

  private applyService(draft: ServiceDraft, service: ManagedService, message: string): void {
    const next = this.toDraft(service);
    next.message = message;
    this.drafts.set(this.drafts().map((item) => (item.id === draft.id ? next : item)));
  }

  private toBody(draft: ServiceDraft) {
    const durationMinutes = Number(draft.durationMinutes);
    const priceCents = pesosToCents(draft.pricePesos);
    const depositCents = pesosToCents(draft.depositPesos);
    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0 || priceCents === null || depositCents === null) {
      draft.message = 'Revisa duración, precio y anticipo. Usa pesos, por ejemplo 850.';
      this.drafts.set([...this.drafts()]);
      return null;
    }
    return {
      name: draft.name.trim(),
      description: draft.description.trim(),
      durationMinutes,
      priceCents,
      depositCents,
      active: draft.active,
    };
  }

  private readError(error: HttpErrorResponse, fallback: string): string {
    const message = error.error?.message;
    return typeof message === 'string' ? message : fallback;
  }
}

function pesosToCents(value: string): number | null {
  const pesos = Number(value);
  if (!Number.isFinite(pesos) || pesos < 0) {
    return null;
  }
  const cents = Math.round(pesos * 100);
  return Number.isInteger(cents) ? cents : null;
}
