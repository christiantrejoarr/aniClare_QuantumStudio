import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, inject, signal } from '@angular/core';
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

import { BookingApi, OpenDay, ReservationView } from '../core/booking-api';
import { CatalogApi } from '../core/catalog-api';
import { formatPesos, SpaService, SpaTherapist } from '../core/catalog';
import { guestCustomerId } from '../core/guest-id';
import { TherapistApi } from '../core/therapist-api';

@Component({
  selector: 'app-reserve',
  templateUrl: 'reserve.page.html',
  styleUrls: ['reserve.page.scss'],
  imports: [
    DatePipe,
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
  private readonly therapistApi = inject(TherapistApi);
  readonly services = signal<SpaService[]>([]);
  readonly therapists = signal<SpaTherapist[]>([]);
  readonly formatPesos = formatPesos;
  readonly minStart = new Date().toISOString();
  readonly maxStart = addDays(new Date(), 60).toISOString();
  readonly serviceId = signal('');
  readonly therapistId = signal('');
  readonly startsAt = signal(defaultStart());
  readonly openDays = signal<OpenDay[]>([]);
  readonly calendarStamp = signal(0);
  readonly isDateEnabled = (iso: string): boolean => this.hoursFor(iso.slice(0, 10)).length > 0;
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly confirmation = signal<ReservationView | null>(null);
  private hoursRequest = 0;
  private styledDatetime: HTMLElement | null = null;

  ngAfterViewChecked(): void {
    const datetime = document.querySelector('ion-datetime');
    if (!(datetime instanceof HTMLElement) || datetime === this.styledDatetime) {
      return;
    }
    const root = datetime.shadowRoot;
    if (!root) {
      return;
    }
    const style = document.createElement('style');
    style.textContent = '.datetime-footer{display:none !important}';
    root.append(style);
    this.styledDatetime = datetime;
  }

  @HostListener('document:ionPopoverDidPresent', ['$event'])
  onTimePopover(event: Event): void {
    const popover = event.target;
    if (!(popover instanceof HTMLElement) || popover.querySelector('[aria-label="Select an hour"]') === null) {
      return;
    }
    popover.classList.add('aniclare-time');
    if (!popover.querySelector('.time-actions')) {
      const actions = document.createElement('div');
      actions.className = 'time-actions';
      actions.append(this.timeButton('Cancelar', 'time-cancel', () => void this.finishTime(popover, false)));
      actions.append(this.timeButton('Aceptar', 'time-accept', () => void this.finishTime(popover, true)));
      (popover.querySelector('.popover-viewport') ?? popover).append(actions);
    }
    popover.addEventListener('ionPopoverDidDismiss', () => this.revertTime(popover), { once: true });
  }

  ionViewWillEnter(): void {
    this.catalog.list().subscribe({
      next: (services) => {
        this.services.set(services);
        if (!services.some((service) => service.id === this.serviceId()) && services[0]) {
          this.serviceId.set(services[0].id);
        }
        this.refreshHours();
      },
      error: () => this.errorMessage.set('No pudimos cargar el catálogo.'),
    });
    this.therapistApi.list().subscribe({
      next: (therapists) => {
        this.therapists.set(therapists);
        if (!therapists.some((therapist) => therapist.id === this.therapistId()) && therapists[0]) {
          this.therapistId.set(therapists[0].id);
        }
        this.refreshHours();
      },
      error: () => this.errorMessage.set('No pudimos cargar a las terapeutas.'),
    });
  }

  onService(event: CustomEvent<{ value?: string }>): void {
    if (typeof event.detail.value === 'string') {
      this.serviceId.set(event.detail.value);
      this.refreshHours();
    }
  }

  onTherapist(event: CustomEvent<{ value?: string }>): void {
    if (typeof event.detail.value === 'string') {
      this.therapistId.set(event.detail.value);
      this.refreshHours();
    }
  }

  therapistName(id: string): string {
    return this.therapists().find((therapist) => therapist.id === id)?.name ?? 'Terapeuta';
  }

  hourValues(): string {
    const hours = this.hoursFor(this.startsAt().slice(0, 10)).map((hour) => String(Number(hour.slice(0, 2))));
    return hours.length > 0 ? hours.join(',') : '0';
  }

  slotOpen(): boolean {
    const value = this.startsAt();
    return this.hoursFor(value.slice(0, 10)).includes(value.slice(11, 16));
  }

  onStart(event: CustomEvent<{ value?: string | string[] | null }>): void {
    const value = event.detail.value;
    if (typeof value !== 'string') {
      return;
    }
    const snapped = this.snapValue(value);
    if (snapped && snapped !== this.startsAt()) {
      this.startsAt.set(snapped);
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
          this.refreshHours();
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.errorMessage.set(
            typeof message === 'string' ? message : 'No pudimos completar la reserva.',
          );
          this.submitting.set(false);
          this.refreshHours();
        },
      });
  }

  private timeButton(label: string, className: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    });
    return button;
  }

  private async finishTime(popover: HTMLElement, accept: boolean): Promise<void> {
    const datetime = this.timeControl();
    if (accept) {
      popover.dataset['confirmed'] = 'true';
      await datetime?.confirm(false);
    } else {
      await datetime?.cancel(false);
    }
    try {
      await (popover as TimePopover).dismiss();
    } catch {
      // The overlay can already be closed when the hour is confirmed.
    }
  }

  private revertTime(popover: HTMLElement): void {
    if (popover.dataset['confirmed'] === 'true') {
      popover.dataset['confirmed'] = '';
      return;
    }
    void this.timeControl()?.cancel(false);
  }

  private timeControl(): TimeDatetime | null {
    const datetime = document.querySelector('ion-datetime');
    return datetime instanceof HTMLElement ? (datetime as TimeDatetime) : null;
  }

  private refreshHours(): void {
    const serviceId = this.serviceId();
    const therapistId = this.therapistId();
    if (!serviceId || !therapistId) {
      return;
    }
    const from = formatDay(new Date());
    const to = formatDay(addDays(new Date(), 60));
    const request = ++this.hoursRequest;
    this.api.availability(therapistId, serviceId, from, to).subscribe({
      next: (days) => {
        if (request !== this.hoursRequest) {
          return;
        }
        this.openDays.set(days);
        const snapped = this.snapValue(this.startsAt()) ?? this.firstOpen(this.startsAt());
        if (snapped) {
          this.startsAt.set(snapped);
        }
        this.calendarStamp.update((stamp) => stamp + 1);
      },
      error: () => {
        if (request !== this.hoursRequest) {
          return;
        }
        this.openDays.set([]);
        this.calendarStamp.set(0);
        this.errorMessage.set('No pudimos consultar los horarios libres.');
      },
    });
  }

  private hoursFor(day: string): string[] {
    return this.openDays().find((item) => item.date === day)?.hours ?? [];
  }

  private snapValue(value: string): string | null {
    const hours = this.hoursFor(value.slice(0, 10));
    if (hours.length === 0) {
      return null;
    }
    const picked = value.slice(11, 16);
    const hour = hours.includes(picked) ? picked : hours[0];
    return value.replace(/T\d{2}:\d{2}/, `T${hour}`);
  }

  private firstOpen(current: string): string | null {
    const next = this.openDays().find((day) => day.hours.length > 0);
    if (!next) {
      return null;
    }
    const offset = current.slice(19) || '-06:00';
    return `${next.date}T${next.hours[0]}:00${offset}`;
  }
}

interface TimePopover extends HTMLElement {
  dismiss: () => Promise<boolean>;
}

interface TimeDatetime extends HTMLElement {
  confirm: (closeParent?: boolean) => Promise<void>;
  cancel: (closeParent?: boolean) => Promise<void>;
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatDay(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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
