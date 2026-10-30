export function liveTopic(url: string): string | null {
  const path = url.split('?')[0] ?? '';
  if (path.includes('/admin/session')) {
    return null;
  }
  if (path.includes('/reservations') || path.includes('/waitlist')) {
    return 'reservations';
  }
  if (path.includes('/services')) {
    return 'catalog';
  }
  if (path.includes('/therapists')) {
    return 'therapists';
  }
  if (path.includes('/working-hours')) {
    return 'hours';
  }
  if (path.includes('/users')) {
    return 'users';
  }
  return null;
}
