import { DomainError } from '../errors/domain-error';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ServiceId {
  private constructor(readonly value: string) {}

  static generate(): ServiceId {
    return new ServiceId(crypto.randomUUID());
  }

  static from(value: string): ServiceId {
    if (!UUID_PATTERN.test(value)) {
      throw new DomainError('INVALID_SERVICE', 'El identificador del servicio no es válido.');
    }
    return new ServiceId(value.toLowerCase());
  }

  equals(other: ServiceId): boolean {
    return this.value === other.value;
  }
}
