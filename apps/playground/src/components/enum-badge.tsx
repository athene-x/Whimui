import type { ComponentProps } from 'react';

import { Badge } from '@/components/ui/badge';

export type EnumBadgeProps<TValue extends string> = {
  value: TValue;
  /** Display text per value; usually `t(value)` of the enum's message namespace. */
  label: string;
  classNames: Partial<Record<TValue, string>>;
  variant?: ComponentProps<typeof Badge>['variant'];
};

export const SEVERITY_CLASS_NAME = {
  Low: 'text-muted-foreground',
  Medium: '',
  High: 'border-warning text-warning-foreground',
  Critical: 'border-critical text-critical-foreground',
} satisfies Record<'Low' | 'Medium' | 'High' | 'Critical', string>;

/** A badge whose colour follows an enum value (status, severity, priority…). */
export function EnumBadge<TValue extends string>({
  value,
  label,
  classNames,
  variant = 'outline',
}: EnumBadgeProps<TValue>) {
  return (
    <Badge variant={variant} className={classNames[value]}>
      {label}
    </Badge>
  );
}
