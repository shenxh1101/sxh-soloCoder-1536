export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = d2.getTime() - d1.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function isSameDay(dateStr: string, reference: Date = new Date()): boolean {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}

export function isThisWeek(dateStr: string, reference: Date = new Date()): boolean {
  const d = new Date(dateStr);
  const ref = new Date(reference);
  const day = ref.getDay();
  const diff = ref.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(ref.getFullYear(), ref.getMonth(), diff, 0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return d >= weekStart && d < weekEnd;
}

export function isThisMonth(dateStr: string, reference: Date = new Date()): boolean {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth()
  );
}

export function isInRange(dateStr: string, range: 'today' | 'week' | 'month'): boolean {
  switch (range) {
    case 'today': return isSameDay(dateStr);
    case 'week': return isThisWeek(dateStr);
    case 'month': return isThisMonth(dateStr);
  }
}

export function isBetweenDates(dateStr: string, startDate: string, endDate: string): boolean {
  const d = new Date(dateStr);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return d >= start && d <= end;
}
