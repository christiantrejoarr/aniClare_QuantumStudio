import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingPolicy, BookingPolicySnapshot } from '../../domain/ports/booking-policy.port';
import { CancellationPolicy } from '../../domain/value-objects/cancellation-policy';

@Injectable()
export class EnvBookingPolicy implements BookingPolicy {
  constructor(private readonly config: ConfigService) {}

  async current(): Promise<BookingPolicySnapshot> {
    return {
      holdMinutes: numberSetting(this.config, 'BOOKING_HOLD_MINUTES', 10),
      cancellation: CancellationPolicy.create(
        numberSetting(this.config, 'BOOKING_CANCELLATION_NOTICE_HOURS', 24),
        numberSetting(this.config, 'BOOKING_LATE_REFUND_PERCENT', 0),
      ),
    };
  }
}

function numberSetting(config: ConfigService, key: string, fallback: number): number {
  const raw = config.get<string | number>(key, fallback);
  return typeof raw === 'number' ? raw : Number(raw);
}
