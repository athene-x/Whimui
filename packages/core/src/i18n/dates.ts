import { formatISO, startOfToday } from 'date-fns';

export function toIsoDate(date: Date): string {
  return formatISO(date, { representation: 'date' });
}

export function todayIsoDate(): string {
  return toIsoDate(startOfToday());
}

export function isoDateOf(timestamp: string): string {
  return timestamp.slice(0, 10);
}
