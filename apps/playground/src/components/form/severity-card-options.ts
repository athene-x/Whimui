import type { Icon } from '@tabler/icons-react';

import type { RadioCardOption } from './radio-card-field';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

type SeverityStyle = { icon: string; card: string; radio: string };

export const SEVERITY_CARD_STYLES = {
  Low: {
    icon: 'text-green-600',
    card: 'border-green-600/30 text-green-600 not-has-data-checked:hover:bg-green-600/5! has-data-checked:border-green-600 has-data-checked:bg-green-600/10! dark:has-data-checked:bg-green-600/15!',
    radio: 'data-checked:border-green-600 data-checked:bg-green-600 dark:data-checked:bg-green-600',
  },
  Medium: {
    icon: 'text-yellow-600',
    card: 'border-yellow-600/30 text-yellow-600 not-has-data-checked:hover:bg-yellow-600/5! has-data-checked:border-yellow-600 has-data-checked:bg-yellow-600/10! dark:has-data-checked:bg-yellow-600/15!',
    radio:
      'data-checked:border-yellow-600 data-checked:bg-yellow-600 dark:data-checked:bg-yellow-600',
  },
  High: {
    icon: 'text-orange-600',
    card: 'border-orange-600/30 text-orange-600 not-has-data-checked:hover:bg-orange-600/5! has-data-checked:border-orange-600 has-data-checked:bg-orange-600/10! dark:has-data-checked:bg-orange-600/15!',
    radio:
      'data-checked:border-orange-600 data-checked:bg-orange-600 dark:data-checked:bg-orange-600',
  },
  Critical: {
    icon: 'text-red-600',
    card: 'border-red-600/30 text-red-600 not-has-data-checked:hover:bg-red-600/5! has-data-checked:border-red-600 has-data-checked:bg-red-600/10! dark:has-data-checked:bg-red-600/15!',
    radio: 'data-checked:border-red-600 data-checked:bg-red-600 dark:data-checked:bg-red-600',
  },
} satisfies Record<SeverityLevel, SeverityStyle>;

export function severityCardOption(
  value: SeverityLevel,
  label: string,
  icon: Icon,
): RadioCardOption {
  const style = SEVERITY_CARD_STYLES[value];
  return {
    value,
    label,
    icon,
    className: style.card,
    iconClassName: style.icon,
    radioClassName: style.radio,
  };
}
