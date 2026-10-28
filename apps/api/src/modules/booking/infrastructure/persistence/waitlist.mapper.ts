import { WaitlistEntry } from '../../domain/entities/waitlist-entry';
import { CustomerId, ServiceId, TherapistId, WaitlistEntryId } from '../../domain/value-objects/identifiers';
import { TimeSlot } from '../../domain/value-objects/time-slot';
import { WaitlistOrmEntity } from './waitlist.orm-entity';

export function waitlistToOrm(entry: WaitlistEntry): WaitlistOrmEntity {
  const row = new WaitlistOrmEntity();
  row.id = entry.id.value;
  row.customerId = entry.customerId.value;
  row.serviceId = entry.serviceId.value;
  row.therapistId = entry.therapistId.value;
  row.startsAt = entry.slot.startsAt;
  row.endsAt = entry.slot.endsAt;
  row.status = entry.status;
  row.createdAt = entry.createdAt;
  row.notifiedAt = entry.notifiedAt;
  return row;
}

export function waitlistToDomain(row: WaitlistOrmEntity): WaitlistEntry {
  return WaitlistEntry.restore({
    id: WaitlistEntryId.from(row.id),
    customerId: CustomerId.from(row.customerId),
    serviceId: ServiceId.from(row.serviceId),
    therapistId: TherapistId.from(row.therapistId),
    slot: TimeSlot.create(new Date(row.startsAt), new Date(row.endsAt)),
    status: row.status,
    createdAt: new Date(row.createdAt),
    notifiedAt: row.notifiedAt ? new Date(row.notifiedAt) : null,
  });
}
