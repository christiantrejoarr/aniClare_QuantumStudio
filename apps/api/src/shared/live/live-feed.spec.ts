import { liveTopic } from './live-topic';

describe('aviso en vivo', () => {
  it('avisa el tema que cambió y no la entrada al panel', () => {
    expect(liveTopic('/api/reservations')).toBe('reservations');
    expect(liveTopic('/api/admin/services/1')).toBe('catalog');
    expect(liveTopic('/api/admin/working-hours/days')).toBe('hours');
    expect(liveTopic('/api/admin/session')).toBeNull();
  });
});
