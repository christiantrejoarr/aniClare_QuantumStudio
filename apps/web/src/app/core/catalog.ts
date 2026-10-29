export interface SpaService {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  depositCents: number;
  currency: 'MXN';
}

export interface SpaTherapist {
  id: string;
  givenName: string;
  familyName: string;
  name: string;
}

export function formatPesos(cents: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
