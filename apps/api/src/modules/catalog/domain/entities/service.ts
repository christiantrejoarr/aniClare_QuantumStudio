import { DomainError } from '../errors/domain-error';
import { Money } from '../value-objects/money';
import { ServiceId } from '../value-objects/service-id';

export interface ServiceSnapshot {
  id: ServiceId;
  name: string;
  description: string;
  durationMinutes: number;
  price: Money;
  deposit: Money;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Service {
  private constructor(private readonly props: ServiceSnapshot) {}

  static register(input: {
    id: ServiceId;
    name: string;
    description: string;
    durationMinutes: number;
    price: Money;
    deposit: Money;
    now: Date;
  }): Service {
    return new Service({
      id: input.id,
      name: requireName(input.name),
      description: requireDescription(input.description),
      durationMinutes: requireDuration(input.durationMinutes),
      price: input.price,
      deposit: requireDeposit(input.price, input.deposit),
      active: true,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  static restore(snapshot: ServiceSnapshot): Service {
    return new Service(snapshot);
  }

  get id(): ServiceId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get durationMinutes(): number {
    return this.props.durationMinutes;
  }

  get price(): Money {
    return this.props.price;
  }

  get deposit(): Money {
    return this.props.deposit;
  }

  get active(): boolean {
    return this.props.active;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  revise(input: {
    name: string;
    description: string;
    durationMinutes: number;
    price: Money;
    deposit: Money;
    active: boolean;
    now: Date;
  }): void {
    this.props.name = requireName(input.name);
    this.props.description = requireDescription(input.description);
    this.props.durationMinutes = requireDuration(input.durationMinutes);
    this.props.price = input.price;
    this.props.deposit = requireDeposit(input.price, input.deposit);
    this.props.active = input.active;
    this.props.updatedAt = input.now;
  }
}

function requireName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    throw new DomainError('INVALID_SERVICE', 'El nombre del servicio debe tener entre 2 y 80 caracteres.');
  }
  return trimmed;
}

function requireDescription(description: string): string {
  const trimmed = description.trim();
  if (trimmed.length > 280) {
    throw new DomainError('INVALID_SERVICE', 'La descripción del servicio es demasiado larga.');
  }
  return trimmed;
}

function requireDuration(durationMinutes: number): number {
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0 || durationMinutes > 480) {
    throw new DomainError('INVALID_SERVICE', 'La duración del servicio no es válida.');
  }
  return durationMinutes;
}

function requireDeposit(price: Money, deposit: Money): Money {
  if (deposit.amountCents > price.amountCents) {
    throw new DomainError('INVALID_PRICE', 'El anticipo no puede ser mayor que el precio.');
  }
  return deposit;
}
