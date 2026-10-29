import { BookingFacade, ReservationView } from '../../booking/public';
import { CatalogFacade, RegisterServiceCommand, ReviseServiceCommand, ServiceView } from '../../catalog/public';
import { AdminUserView, IdentityFacade, SessionProfile } from '../../identity/public';
import {
  SchedulingFacade,
  SpecialDayCommand,
  TherapistView,
  WorkingHoursCommand,
  WorkingHoursView,
} from '../../scheduling/public';

export class AdminDesk {
  constructor(
    private readonly catalog: CatalogFacade,
    private readonly booking: BookingFacade,
    private readonly identity: IdentityFacade,
    private readonly scheduling: SchedulingFacade,
  ) {}

  listReservations(): Promise<ReservationView[]> {
    return this.booking.listAgenda();
  }

  attendReservation(reservationId: string): Promise<ReservationView> {
    return this.booking.attend(reservationId);
  }

  cancelReservation(reservationId: string): Promise<ReservationView> {
    return this.booking.cancelFromDesk(reservationId);
  }

  listServices(): Promise<ServiceView[]> {
    return this.catalog.listManaged();
  }

  reviseService(command: ReviseServiceCommand): Promise<ServiceView> {
    return this.catalog.revise(command);
  }

  registerService(command: RegisterServiceCommand): Promise<ServiceView> {
    return this.catalog.register(command);
  }

  removeService(serviceId: string): Promise<void> {
    return this.catalog.remove(serviceId);
  }

  profile(actorUsername: string): Promise<SessionProfile> {
    return this.identity.profile(actorUsername);
  }

  listUsers(): Promise<AdminUserView[]> {
    return this.identity.listUsers();
  }

  registerUser(username: string, password: string, administrator: boolean, actorUsername: string): Promise<AdminUserView> {
    return this.identity.registerUser(username, password, administrator, actorUsername);
  }

  reviseUser(id: string, username: string, password: string | undefined, actorUsername: string): Promise<AdminUserView> {
    return this.identity.reviseUser(id, username, password, actorUsername);
  }

  removeUser(id: string, actorUsername: string): Promise<void> {
    return this.identity.removeUser(id, actorUsername);
  }

  listTherapists(): Promise<TherapistView[]> {
    return this.scheduling.list();
  }

  registerTherapist(givenName: string, familyName: string): Promise<TherapistView> {
    return this.scheduling.register(givenName, familyName);
  }

  reviseTherapist(id: string, givenName: string, familyName: string): Promise<TherapistView> {
    return this.scheduling.revise(id, givenName, familyName);
  }

  removeTherapist(id: string): Promise<void> {
    return this.scheduling.remove(id);
  }

  workingHours(): Promise<WorkingHoursView> {
    return this.scheduling.workingHours();
  }

  saveWorkingHours(command: WorkingHoursCommand): Promise<WorkingHoursView> {
    return this.scheduling.saveWorkingHours(command);
  }

  addSpecialDay(command: SpecialDayCommand): Promise<WorkingHoursView> {
    return this.scheduling.addSpecialDay(command);
  }

  removeSpecialDay(day: string): Promise<WorkingHoursView> {
    return this.scheduling.removeSpecialDay(day);
  }
}
