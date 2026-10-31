import type { Formats } from 'next-intl';

export const formats = {
  dateTime: {
    date: { dateStyle: 'medium', timeZone: 'UTC' },
    dateTime: { dateStyle: 'medium', timeStyle: 'short' },
    monthYear: { month: 'long', year: 'numeric' },
  },
  number: {
    integer: { maximumFractionDigits: 0 },
  },
} satisfies Formats;
