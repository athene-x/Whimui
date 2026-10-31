import { formatISO, startOfToday } from 'date-fns';

/** Formats the calendar date in the runtime's local timezone, without converting to UTC. */
export function toIsoDate(date: Date): string {
  return formatISO(date, { representation: 'date' });
}

/** Today's date in the runtime's local timezone; does not use next-intl's timezone setting. */
export function todayIsoDate(): string {
  return toIsoDate(startOfToday());
}

/** Takes the first ten characters of an ISO timestamp without validation or timezone conversion. */
export function isoDateOf(timestamp: string): string {
  return timestamp.slice(0, 10);
}
