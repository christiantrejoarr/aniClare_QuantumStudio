import { Injectable } from '@nestjs/common';
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
}
