import { Injectable } from '@nestjs/common';
import { AttendReservationUseCase } from '../application/use-cases/attend-reservation.use-case';
import { DeskCancelReservationUseCase } from '../application/use-cases/desk-cancel-reservation.use-case';
import { ConfirmReservationDepositUseCase } from '../application/use-cases/confirm-reservation-deposit.use-case';
import { ListAgendaUseCase } from '../application/use-cases/list-agenda.use-case';
import { ListAppointmentHistoryUseCase } from '../application/use-cases/list-appointment-history.use-case';
import { ReservationView } from '../application/reservation-view';

@Injectable()
export class BookingFacade {
  constructor(
    private readonly confirmDeposit: ConfirmReservationDepositUseCase,
    private readonly history: ListAppointmentHistoryUseCase,
    private readonly agenda: ListAgendaUseCase,
    private readonly attendReservation: AttendReservationUseCase,
    private readonly deskCancel: DeskCancelReservationUseCase,
  ) {}

  confirmDepositPaid(reservationId: string): Promise<ReservationView> {
    return this.confirmDeposit.execute({ reservationId });
  }

  appointmentHistory(customerId: string): Promise<ReservationView[]> {
    return this.history.execute(customerId);
  }

  listAgenda(): Promise<ReservationView[]> {
    return this.agenda.execute();
  }

  attend(reservationId: string): Promise<ReservationView> {
    return this.attendReservation.execute(reservationId);
  }

  cancelFromDesk(reservationId: string): Promise<ReservationView> {
    return this.deskCancel.execute(reservationId);
  }
}
