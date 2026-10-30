import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline } from 'ionicons/icons';
import { forkJoin } from 'rxjs';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular';

import { AdminApi, AdminSession, AdminTherapist, AdminUser, ManagedService, WorkingHours } from '../core/admin-api';
import { ReservationView } from '../core/booking-api';
import { formatPesos } from '../core/catalog';
import { LiveUpdates } from '../core/live-updates';

interface ServiceDraft {
  id: string;
  name: string;
  description: string;
  durationMinutes: string;
  pricePesos: string;
  depositPesos: string;
  active: boolean;
  editing: boolean;
  saving: boolean;
  message: string | null;
}

interface UserDraft {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  password: string;
  editing: boolean;
  saving: boolean;
  message: string | null;
}

interface TherapistDraft {
  id: string;
  givenName: string;
  familyName: string;
  editing: boolean;
  saving: boolean;
  message: string | null;
}

type DeleteTarget =
  | { kind: 'service'; draft: ServiceDraft }
  | { kind: 'user'; draft: UserDraft }
  | { kind: 'therapist'; draft: TherapistDraft }
  | { kind: 'special'; day: string };

type Section = 'reservas' | 'servicios' | 'terapeutas' | 'horas' | 'usuarios';

type WeekFlag =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'allowWeekends'
  | 'allowHolidays'
  | 'allowHalfDays';

const weekdays: Array<{ key: WeekFlag; label: string }> = [
  { key: 'monday', label: 'Lun' },
  { key: 'tuesday', label: 'Mar' },
  { key: 'wednesday', label: 'Mié' },
  { key: 'thursday', label: 'Jue' },
  { key: 'friday', label: 'Vie' },
  { key: 'saturday', label: 'Sáb' },
  { key: 'sunday', label: 'Dom' },
];

const statusLabel: Record<ReservationView['status'], string> = {
  pending_payment: 'Esperando anticipo',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  expired: 'Apartado vencido',
  attended: 'Atendida',
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
    IonIcon,
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
  readonly username = signal('');
  readonly password = signal('');
  readonly weekdays = weekdays;
  readonly section = signal<Section>('reservas');
  readonly sectionSlide = signal('');
  readonly reservations = signal<ReservationView[]>([]);
  readonly drafts = signal<ServiceDraft[]>([]);
  readonly users = signal<UserDraft[]>([]);
  readonly therapists = signal<TherapistDraft[]>([]);
  readonly newGivenName = signal('');
  readonly newFamilyName = signal('');
  readonly therapistMessage = signal<string | null>(null);
  readonly hours = signal<WorkingHours | null>(null);
  readonly hoursSaving = signal(false);
  readonly hoursMessage = signal<string | null>(null);
  readonly holidayDate = signal('');
  readonly halfDate = signal('');
  readonly halfOpens = signal('10:00');
  readonly halfCloses = signal('14:00');
  readonly newNote = signal<ServiceDraft | null>(null);
  readonly newUsername = signal('');
  readonly newPassword = signal('');
  readonly newAdministrator = signal(false);
  readonly administrator = signal(false);
  readonly userMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly loading = signal(false);
  readonly busyReservation = signal<string | null>(null);
  readonly confirmOpen = signal(false);
  private readonly deleteTarget = signal<DeleteTarget | null>(null);

  constructor() {
    addIcons({ pencilOutline, trashOutline });
    inject(LiveUpdates)
      .changes(['reservations', 'catalog', 'therapists', 'hours', 'users'])
      .subscribe(() => {
        if (this.authenticated()) {
          this.load(true);
        }
      });
  }

  ionViewWillEnter(): void {
    if (!this.api.token()) {
      this.authenticated.set(false);
      return;
    }
    this.authenticated.set(true);
    this.load();
  }

  onUsername(event: { detail: { value?: string | number | null } }): void {
    this.username.set(String(event.detail.value ?? ''));
  }

  onPassword(event: { detail: { value?: string | number | null } }): void {
    this.password.set(String(event.detail.value ?? ''));
  }

  enter(): void {
    const username = this.username().trim();
    const password = this.password();
    if (!username || !password) {
      this.errorMessage.set('Escribe usuario y contraseña.');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.openSession(username, password).subscribe({
      next: (session: AdminSession) => {
        this.api.remember(session.token);
        this.password.set('');
        this.authenticated.set(true);
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.api.forget();
        this.errorMessage.set(
          error.status === 401 ? 'Usuario o contraseña incorrectos.' : this.readError(error, 'No pudimos entrar al panel.'),
        );
      },
    });
  }

  leave(): void {
    this.cancelDelete();
    this.api.forget();
    this.authenticated.set(false);
    this.administrator.set(false);
    this.newAdministrator.set(false);
    this.loading.set(false);
    this.password.set('');
    this.reservations.set([]);
    this.drafts.set([]);
    this.users.set([]);
    this.therapists.set([]);
    this.newNote.set(null);
    this.errorMessage.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmOpen()) {
      this.cancelDelete();
    }
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
    this.confirmOpen.set(false);
  }

  acceptDelete(): void {
    const target = this.deleteTarget();
    this.deleteTarget.set(null);
    this.confirmOpen.set(false);
    if (!target) {
      return;
    }
    if (target.kind === 'service') {
      this.commitRemoveService(target.draft);
      return;
    }
    if (target.kind === 'user') {
      this.commitRemoveUser(target.draft);
      return;
    }
    if (target.kind === 'special') {
      this.commitRemoveSpecial(target.day);
      return;
    }
    this.commitRemoveTherapist(target.draft);
  }

  backHome(): void {
    void this.router.navigate(['/home']);
  }

  onSection(event: { detail: { value?: string | number } }): void {
    const value = event.detail.value;
    if (value !== 'reservas' && value !== 'servicios' && value !== 'terapeutas' && value !== 'horas' && value !== 'usuarios') {
      return;
    }
    if (value === this.section()) {
      return;
    }
    const order = ['reservas', 'servicios', 'terapeutas', 'horas', 'usuarios'];
    const forward = order.indexOf(value) > order.indexOf(this.section());
    this.section.set(value);
    const side = this.sectionSlide().endsWith('-a') ? 'b' : 'a';
    this.sectionSlide.set(`${forward ? 'forward' : 'back'}-${side}`);
  }

  therapistName(id: string): string {
    const therapist = this.therapists().find((item) => item.id === id);
    return therapist ? this.personName(therapist) : 'Terapeuta';
  }

  personName(person: { givenName: string; familyName: string }): string {
    return [person.givenName.trim(), person.familyName.trim()].filter(Boolean).join(' ');
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
    this.newNote.set({ ...draft });
  }

  onVisible(draft: ServiceDraft, event: { detail: { checked: boolean } }): void {
    if (event.detail.checked === draft.active || draft.saving) {
      return;
    }
    const previous = draft.active;
    draft.active = event.detail.checked;
    draft.message = null;
    const body = this.toBody(draft);
    if (!body) {
      draft.active = previous;
      this.drafts.set([...this.drafts()]);
      return;
    }
    draft.saving = true;
    this.drafts.set([...this.drafts()]);
    this.api.revise(draft.id, body).subscribe({
      next: (service) => this.applyService(draft, service, '', true),
      error: (error: HttpErrorResponse) => {
        draft.active = previous;
        this.failDraft(draft, error, 'No pudimos actualizar la visibilidad.', false);
      },
    });
  }

  canAttend(reservation: ReservationView): boolean {
    return reservation.status === 'pending_payment' || reservation.status === 'confirmed';
  }

  canCancel(reservation: ReservationView): boolean {
    return this.canAttend(reservation) || reservation.status === 'expired';
  }

  attend(reservation: ReservationView): void {
    this.changeReservation(reservation, 'attend');
  }

  cancelReservation(reservation: ReservationView): void {
    this.changeReservation(reservation, 'cancel');
  }

  toggleEdit(draft: ServiceDraft): void {
    draft.editing = !draft.editing;
    draft.message = null;
    this.drafts.set([...this.drafts()]);
  }

  startNote(): void {
    this.newNote.set({
      id: '',
      name: '',
      description: '',
      durationMinutes: '60',
      pricePesos: '',
      depositPesos: '',
      active: true,
      editing: true,
      saving: false,
      message: null,
    });
  }

  cancelNote(): void {
    this.newNote.set(null);
  }

  saveNew(): void {
    const draft = this.newNote();
    if (!draft) {
      return;
    }
    const body = this.toBody(draft);
    if (!body) {
      this.newNote.set({ ...draft });
      return;
    }
    draft.saving = true;
    this.newNote.set({ ...draft });
    this.api.createService(body).subscribe({
      next: (service) => {
        this.drafts.set([this.toDraft(service), ...this.drafts()]);
        this.newNote.set(null);
      },
      error: (error: HttpErrorResponse) => this.failDraft(draft, error, 'No pudimos crear el servicio.', true),
    });
  }

  removeService(draft: ServiceDraft): void {
    this.deleteTarget.set({ kind: 'service', draft });
    this.confirmOpen.set(true);
  }

  private commitRemoveService(draft: ServiceDraft): void {
    draft.saving = true;
    this.drafts.set([...this.drafts()]);
    this.api.removeService(draft.id).subscribe({
      next: () => this.drafts.set(this.drafts().filter((item) => item.id !== draft.id)),
      error: (error: HttpErrorResponse) => this.failDraft(draft, error, 'No pudimos borrar el servicio.', false),
    });
  }

  onNewAdministrator(event: { detail: { checked: boolean } }): void {
    this.newAdministrator.set(event.detail.checked);
    this.userMessage.set(null);
  }

  onNewUser(field: 'username' | 'password', event: { detail: { value?: string | number | null } }): void {
    const value = String(event.detail.value ?? '');
    if (field === 'username') {
      this.newUsername.set(value);
    } else {
      this.newPassword.set(value);
    }
    this.userMessage.set(null);
  }

  createUser(): void {
    const username = this.newUsername().trim();
    const password = this.newPassword();
    if (username.length < 2 || password.length < 8) {
      this.userMessage.set('El usuario necesita al menos 2 caracteres y la contraseña 8.');
      return;
    }
    this.api.createUser(username, password, this.administrator() && this.newAdministrator()).subscribe({
      next: (user) => {
        this.users.set([...this.users(), this.toUser(user)].sort((left, right) => left.username.localeCompare(right.username)));
        this.newUsername.set('');
        this.newPassword.set('');
        this.newAdministrator.set(false);
        this.userMessage.set(user.role === 'admin' ? 'Cuenta administrador creada.' : 'Usuario creado.');
      },
      error: (error: HttpErrorResponse) => this.failMessage(error, 'No pudimos crear el usuario.'),
    });
  }

  onUser(draft: UserDraft, field: 'username' | 'password', event: { detail: { value?: string | number | null } }): void {
    draft[field] = String(event.detail.value ?? '');
    draft.message = null;
  }

  toggleUser(draft: UserDraft): void {
    draft.editing = !draft.editing;
    draft.password = '';
    draft.message = null;
    this.users.set([...this.users()]);
  }

  saveUser(draft: UserDraft): void {
    const username = draft.username.trim();
    if (username.length < 2 || (draft.password && draft.password.length < 8)) {
      draft.message = 'El usuario necesita al menos 2 caracteres. La contraseña nueva, 8.';
      this.users.set([...this.users()]);
      return;
    }
    draft.saving = true;
    this.users.set([...this.users()]);
    this.api.reviseUser(draft.id, username, draft.password || undefined).subscribe({
      next: (user) => {
        const next = this.toUser(user);
        next.message = user.username === this.username().trim()
          ? 'Si cambiaste tu usuario, entra de nuevo con el nombre nuevo.'
          : 'Usuario actualizado.';
        this.users.set(this.users().map((item) => (item.id === draft.id ? next : item)));
      },
      error: (error: HttpErrorResponse) => {
        if (this.expired(error)) {
          return;
        }
        draft.saving = false;
        draft.message = this.readError(error, 'No pudimos guardar el usuario.');
        this.users.set([...this.users()]);
      },
    });
  }

  removeUser(draft: UserDraft): void {
    this.deleteTarget.set({ kind: 'user', draft });
    this.confirmOpen.set(true);
  }

  private commitRemoveUser(draft: UserDraft): void {
    this.api.removeUser(draft.id).subscribe({
      next: () => this.users.set(this.users().filter((item) => item.id !== draft.id)),
      error: (error: HttpErrorResponse) => this.failMessage(error, 'No pudimos borrar el usuario.'),
    });
  }

  onNewTherapist(field: 'givenName' | 'familyName', event: { detail: { value?: string | number | null } }): void {
    const value = String(event.detail.value ?? '');
    if (field === 'givenName') {
      this.newGivenName.set(value);
    } else {
      this.newFamilyName.set(value);
    }
    this.therapistMessage.set(null);
  }

  createTherapist(): void {
    const givenName = this.newGivenName().trim();
    const familyName = this.newFamilyName().trim();
    if (givenName.length < 2 || familyName.length < 2) {
      this.therapistMessage.set('El nombre y el apellido necesitan al menos 2 caracteres.');
      return;
    }
    this.api.createTherapist(givenName, familyName).subscribe({
      next: (therapist) => {
        this.therapists.set(this.sortTherapists([...this.therapists(), this.toTherapist(therapist)]));
        this.newGivenName.set('');
        this.newFamilyName.set('');
        this.therapistMessage.set('Terapeuta dada de alta.');
      },
      error: (error: HttpErrorResponse) => this.failMessage(error, 'No pudimos dar de alta a la terapeuta.'),
    });
  }

  onTherapist(draft: TherapistDraft, field: 'givenName' | 'familyName', event: { detail: { value?: string | number | null } }): void {
    draft[field] = String(event.detail.value ?? '');
    draft.message = null;
  }

  toggleTherapist(draft: TherapistDraft): void {
    draft.editing = !draft.editing;
    draft.message = null;
    this.therapists.set([...this.therapists()]);
  }

  saveTherapist(draft: TherapistDraft): void {
    const givenName = draft.givenName.trim();
    const familyName = draft.familyName.trim();
    if (givenName.length < 2 || familyName.length < 2) {
      draft.message = 'El nombre y el apellido necesitan al menos 2 caracteres.';
      this.therapists.set([...this.therapists()]);
      return;
    }
    draft.saving = true;
    this.therapists.set([...this.therapists()]);
    this.api.reviseTherapist(draft.id, givenName, familyName).subscribe({
      next: (therapist) => {
        const next = this.toTherapist(therapist);
        next.message = 'Terapeuta actualizada.';
        this.therapists.set(this.sortTherapists(this.therapists().map((item) => (item.id === draft.id ? next : item))));
      },
      error: (error: HttpErrorResponse) => {
        if (this.expired(error)) {
          return;
        }
        draft.saving = false;
        draft.message = this.readError(error, 'No pudimos guardar a la terapeuta.');
        this.therapists.set([...this.therapists()]);
      },
    });
  }

  removeTherapist(draft: TherapistDraft): void {
    this.deleteTarget.set({ kind: 'therapist', draft });
    this.confirmOpen.set(true);
  }

  private commitRemoveTherapist(draft: TherapistDraft): void {
    this.api.removeTherapist(draft.id).subscribe({
      next: () => this.therapists.set(this.therapists().filter((item) => item.id !== draft.id)),
      error: (error: HttpErrorResponse) => this.failMessage(error, 'No pudimos dar de baja a la terapeuta.'),
    });
  }

  isSelf(draft: UserDraft): boolean {
    return draft.username === this.username().trim();
  }

  isProtected(draft: UserDraft): boolean {
    return draft.username.trim().toLowerCase() === 'admin';
  }

  roleLabel(draft: UserDraft): string {
    return draft.role === 'admin' ? 'Administrador' : 'Puede crear usuarios';
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
        this.applyService(draft, service, 'Nota guardada. Las citas ya hechas conservan el servicio anterior.');
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.leave();
          this.errorMessage.set('La sesión expiró. Entra de nuevo.');
          return;
        }
        draft.saving = false;
        draft.message = this.readError(error, 'No pudimos guardar el servicio.');
        this.drafts.set([...this.drafts()]);
      },
    });
  }

  specials(kind: 'holiday' | 'half_day') {
    return this.hours()?.days.filter((day) => day.kind === kind) ?? [];
  }

  onHoursTime(field: 'opensAt' | 'closesAt', event: { detail: { value?: string | number | null } }): void {
    const journal = this.hours();
    if (!journal) {
      return;
    }
    this.hours.set({ ...journal, [field]: String(event.detail.value ?? '').slice(0, 5) });
    this.hoursMessage.set(null);
  }

  onHoursDay(field: WeekFlag, event: { detail: { checked: boolean } }): void {
    const journal = this.hours();
    if (!journal) {
      return;
    }
    this.hours.set({ ...journal, [field]: event.detail.checked });
    this.hoursMessage.set(null);
  }

  onHolidayDate(event: { detail: { value?: string | number | null } }): void {
    this.holidayDate.set(String(event.detail.value ?? '').slice(0, 10));
  }

  onHalfDate(event: { detail: { value?: string | number | null } }): void {
    this.halfDate.set(String(event.detail.value ?? '').slice(0, 10));
  }

  onHalfTime(field: 'opens' | 'closes', event: { detail: { value?: string | number | null } }): void {
    const value = String(event.detail.value ?? '').slice(0, 5);
    if (field === 'opens') {
      this.halfOpens.set(value);
      return;
    }
    this.halfCloses.set(value);
  }

  saveHours(): void {
    const journal = this.hours();
    if (!journal) {
      return;
    }
    this.hoursSaving.set(true);
    this.hoursMessage.set(null);
    this.api.saveWorkingHours({
      opensAt: journal.opensAt,
      closesAt: journal.closesAt,
      sunday: journal.sunday,
      monday: journal.monday,
      tuesday: journal.tuesday,
      wednesday: journal.wednesday,
      thursday: journal.thursday,
      friday: journal.friday,
      saturday: journal.saturday,
      allowWeekends: journal.allowWeekends,
      allowHolidays: journal.allowHolidays,
      allowHalfDays: journal.allowHalfDays,
    }).subscribe({
      next: (saved) => {
        this.hours.set(saved);
        this.hoursSaving.set(false);
        this.hoursMessage.set('Jornada guardada.');
      },
      error: (error: HttpErrorResponse) => {
        this.hoursSaving.set(false);
        if (this.expired(error)) {
          return;
        }
        this.hoursMessage.set(this.readError(error, 'No pudimos guardar la jornada.'));
      },
    });
  }

  addHoliday(): void {
    const day = this.holidayDate();
    if (!day) {
      this.hoursMessage.set('Elige la fecha del festivo.');
      return;
    }
    this.api.addSpecialDay({ day, kind: 'holiday' }).subscribe({
      next: (saved) => {
        this.hours.set(saved);
        this.holidayDate.set('');
        this.hoursMessage.set('Festivo agregado.');
      },
      error: (error: HttpErrorResponse) => this.failHours(error, 'No pudimos agregar el festivo.'),
    });
  }

  addHalfDay(): void {
    const day = this.halfDate();
    if (!day) {
      this.hoursMessage.set('Elige la fecha del medio día.');
      return;
    }
    this.api.addSpecialDay({ day, kind: 'half_day', opensAt: this.halfOpens(), closesAt: this.halfCloses() }).subscribe({
      next: (saved) => {
        this.hours.set(saved);
        this.halfDate.set('');
        this.hoursMessage.set('Medio día agregado.');
      },
      error: (error: HttpErrorResponse) => this.failHours(error, 'No pudimos agregar el medio día.'),
    });
  }

  askRemoveSpecial(day: string): void {
    this.deleteTarget.set({ kind: 'special', day });
    this.confirmOpen.set(true);
  }

  private commitRemoveSpecial(day: string): void {
    this.api.removeSpecialDay(day).subscribe({
      next: (saved) => this.hours.set(saved),
      error: (error: HttpErrorResponse) => this.failHours(error, 'No pudimos quitar ese día.'),
    });
  }

  private failHours(error: HttpErrorResponse, fallback: string): void {
    if (this.expired(error)) {
      return;
    }
    this.hoursMessage.set(this.readError(error, fallback));
  }

  private load(silent = false): void {
    if (!silent) {
      this.loading.set(true);
    }
    this.errorMessage.set(null);
    forkJoin({
      reservations: this.api.reservations(),
      services: this.api.services(),
      users: this.api.users(),
      therapists: this.api.therapists(),
      hours: this.api.workingHours(),
      profile: this.api.profile(),
    }).subscribe({
      next: ({ reservations, services, users, therapists, hours, profile }) => {
        this.username.set(profile.username);
        this.administrator.set(profile.administrator);
        this.reservations.set(reservations);
        this.drafts.set(services.map((service) => this.toDraft(service)));
        this.users.set(users.map((user) => this.toUser(user)));
        this.therapists.set(therapists.map((therapist) => this.toTherapist(therapist)));
        this.hours.set(hours);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        if (error.status === 401) {
          this.leave();
          this.errorMessage.set('La sesión expiró. Entra de nuevo.');
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
      editing: false,
      message: null,
    };
  }

  private toUser(user: AdminUser): UserDraft {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      password: '',
      editing: false,
      saving: false,
      message: null,
    };
  }

  private toTherapist(therapist: AdminTherapist): TherapistDraft {
    return {
      id: therapist.id,
      givenName: therapist.givenName,
      familyName: therapist.familyName,
      editing: false,
      saving: false,
      message: null,
    };
  }

  private sortTherapists(therapists: TherapistDraft[]): TherapistDraft[] {
    return therapists.sort((left, right) => this.personName(left).localeCompare(this.personName(right), 'es'));
  }

  private applyService(draft: ServiceDraft, service: ManagedService, message: string, keepEditing = false): void {
    const next = this.toDraft(service);
    next.message = message;
    next.editing = keepEditing && draft.editing;
    this.drafts.set(this.drafts().map((item) => (item.id === draft.id ? next : item)));
  }

  private changeReservation(reservation: ReservationView, action: 'attend' | 'cancel'): void {
    this.busyReservation.set(reservation.reservationId);
    const request =
      action === 'attend' ? this.api.attend(reservation.reservationId) : this.api.cancelReservation(reservation.reservationId);
    request.subscribe({
      next: (updated: ReservationView) => {
        this.reservations.set(
          this.reservations().map((item) => (item.reservationId === updated.reservationId ? updated : item)),
        );
        this.busyReservation.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.busyReservation.set(null);
        if (this.expired(error)) {
          return;
        }
        this.errorMessage.set(this.readError(error, 'No pudimos actualizar la reserva.'));
      },
    });
  }

  private failDraft(draft: ServiceDraft, error: HttpErrorResponse, fallback: string, isNew: boolean): void {
    if (this.expired(error)) {
      return;
    }
    draft.saving = false;
    draft.message = this.readError(error, fallback);
    if (isNew) {
      this.newNote.set({ ...draft });
      return;
    }
    this.drafts.set([...this.drafts()]);
  }

  private failMessage(error: HttpErrorResponse, fallback: string): void {
    if (this.expired(error)) {
      return;
    }
    this.userMessage.set(this.readError(error, fallback));
  }

  private expired(error: HttpErrorResponse): boolean {
    if (error.status !== 401) {
      return false;
    }
    this.leave();
    this.errorMessage.set('La sesión expiró. Entra de nuevo.');
    return true;
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
