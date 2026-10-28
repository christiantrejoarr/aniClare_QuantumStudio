import { Service } from '../domain/entities/service';
import { DomainError } from '../domain/errors/domain-error';
import { Money } from '../domain/value-objects/money';
import { ServiceId } from '../domain/value-objects/service-id';

describe('Service', () => {
  const now = new Date('2026-10-27T18:00:00.000Z');

  it('publica un servicio cuando el anticipo no supera el precio', () => {
    const service = Service.register({
      id: ServiceId.generate(),
      name: '  Masaje relajante  ',
      description: 'Sesión de 60 minutos.',
      durationMinutes: 60,
      price: Money.mxn(85_000),
      deposit: Money.mxn(30_000),
      now,
    });

    expect(service.name).toBe('Masaje relajante');
    expect(service.active).toBe(true);
    expect(service.price.amountCents).toBe(85_000);
  });

  it('actualiza el precio y puede ocultar el servicio del sitio', () => {
    const service = Service.register({
      id: ServiceId.generate(),
      name: 'Facial hidratante',
      description: 'Limpieza.',
      durationMinutes: 50,
      price: Money.mxn(70_000),
      deposit: Money.mxn(25_000),
      now,
    });

    service.revise({
      name: 'Facial hidratante',
      description: 'Limpieza e hidratación.',
      durationMinutes: 55,
      price: Money.mxn(75_000),
      deposit: Money.mxn(25_000),
      active: false,
      now: new Date('2026-10-28T18:00:00.000Z'),
    });

    expect(service.price.amountCents).toBe(75_000);
    expect(service.durationMinutes).toBe(55);
    expect(service.active).toBe(false);
    expect(service.createdAt).toEqual(now);
  });

  it('rechaza un anticipo mayor que el precio', () => {
    expect(() =>
      Service.register({
        id: ServiceId.generate(),
        name: 'Masaje',
        description: '',
        durationMinutes: 60,
        price: Money.mxn(20_000),
        deposit: Money.mxn(30_000),
        now,
      }),
    ).toThrow(DomainError);
  });
});
