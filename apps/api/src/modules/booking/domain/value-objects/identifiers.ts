import { DomainError } from '../errors/domain-error';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseUuid(value: string, code: string, message: string): string {
  if (!UUID_PATTERN.test(value)) {
    throw new DomainError(code, message);
  }
  return value.toLowerCase();
}

export class ReservationId {
  private constructor(readonly value: string) {}

  static generate(): ReservationId {
    return new ReservationId(crypto.randomUUID());
  }

  static from(value: string): ReservationId {
    return new ReservationId(
      parseUuid(value, 'INVALID_RESERVATION', 'El identificador de la reserva no es válido.'),
    );
  }
}

export class CustomerId {
  private constructor(readonly value: string) {}

  static from(value: string): CustomerId {
    return new CustomerId(
      parseUuid(value, 'INVALID_CUSTOMER', 'El identificador de cliente no es válido.'),
    );
  }

  equals(other: CustomerId): boolean {
    return this.value === other.value;
  }
}

export class ServiceId {
  private constructor(readonly value: string) {}

  static from(value: string): ServiceId {
    return new ServiceId(
      parseUuid(value, 'INVALID_SERVICE', 'El identificador del servicio no es válido.'),
    );
  }

  equals(other: ServiceId): boolean {
    return this.value === other.value;
  }
}

export class TherapistId {
  private constructor(readonly value: string) {}

  static from(value: string): TherapistId {
    return new TherapistId(
      parseUuid(value, 'INVALID_THERAPIST', 'El identificador de la terapeuta no es válido.'),
    );
  }

  equals(other: TherapistId): boolean {
    return this.value === other.value;
  }
}

export class WaitlistEntryId {
  private constructor(readonly value: string) {}

  static generate(): WaitlistEntryId {
    return new WaitlistEntryId(crypto.randomUUID());
  }

  static from(value: string): WaitlistEntryId {
    return new WaitlistEntryId(
      parseUuid(value, 'INVALID_WAITLIST', 'El identificador de la lista de espera no es válido.'),
    );
  }
}
