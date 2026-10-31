import type en from '@/messages/en';

import type { Locale } from './config';
import type { formats } from './formats';

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof en;
    Formats: typeof formats;
  }
}
