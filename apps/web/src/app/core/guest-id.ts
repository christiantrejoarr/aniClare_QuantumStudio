const storageKey = 'aniclare.customerId';

export function guestCustomerId(): string {
  const existing = localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }
  const created = crypto.randomUUID();
  localStorage.setItem(storageKey, created);
  return created;
}
