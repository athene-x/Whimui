'use client';

import type { AnyFieldMeta } from '@tanstack/react-form';
import type { DateRange } from 'react-day-picker';

import { describedBy, isFieldInvalid, toFieldErrors, useFormContext } from '@athene-x/whimui/form';
import { useMediaQuery } from '@athene-x/whimui/hooks';
import { dateFnsLocale, toIsoDate } from '@athene-x/whimui/i18n';
import { IconChevronDown, IconX } from '@tabler/icons-react';
import {
  addMonths,
  addYears,
  endOfQuarter,
  endOfYear,
  parseISO,
  startOfToday,
  subDays,
} from 'date-fns';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { type ReactNode, useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type DateRangeFieldProps = {
  names: readonly [start: string, end: string];
  label: ReactNode;
  description?: ReactNode;
  placeholder?: string;
  fieldClassName?: string;
  disabled?: boolean;
};

const YEARS_BEFORE = 1;
const YEARS_AFTER = 10;

type Preset = {
  key: 'months' | 'year' | 'endOfQuarter' | 'endOfYear';
  months?: number;
  to: (from: Date) => Date;
};

const PRESETS: Preset[] = [
  { key: 'months', months: 1, to: (from) => subDays(addMonths(from, 1), 1) },
  { key: 'months', months: 3, to: (from) => subDays(addMonths(from, 3), 1) },
  { key: 'months', months: 6, to: (from) => subDays(addMonths(from, 6), 1) },
  { key: 'year', to: (from) => subDays(addYears(from, 1), 1) },
  { key: 'endOfQuarter', to: endOfQuarter },
  { key: 'endOfYear', to: endOfYear },
];

function toDate(value: unknown): Date | undefined {
  return typeof value === 'string' && value ? parseISO(value) : undefined;
}

export function DateRangeField({
  names: [startName, endName],
  label,
  description,
  placeholder,
  fieldClassName,
  disabled,
}: DateRangeFieldProps) {
  const t = useTranslations('ui.dateRange');
  const format = useFormatter();
  const locale = useLocale();
  const id = useId();
  const form = useFormContext();
  const [open, setOpen] = useState(false);
  const twoMonths = useMediaQuery('(min-width: 640px)');
  const today = startOfToday();
  const startMonth = new Date(today.getFullYear() - YEARS_BEFORE, 0);
  const endMonth = new Date(today.getFullYear() + YEARS_AFTER, 11);

  const formatDay = (value: string) => format.dateTime(parseISO(value), { dateStyle: 'medium' });

  const setRange = (range: DateRange | undefined) => {
    form.setFieldValue(startName as never, (range?.from ? toIsoDate(range.from) : '') as never);
    form.setFieldValue(endName as never, (range?.to ? toIsoDate(range.to) : '') as never);
  };

  return (
    <form.Subscribe
      selector={(state) => {
        const meta = state.fieldMeta as Partial<Record<string, AnyFieldMeta>>;
        return [
          state.values[startName],
          state.values[endName],
          meta[startName],
          meta[endName],
        ] as const;
      }}
    >
      {([startValue, endValue, startMeta, endMeta]) => {
        const from = toDate(startValue);
        const to = toDate(endValue);
        const invalid =
          (startMeta != null && isFieldInvalid(startMeta)) ||
          (endMeta != null && isFieldInvalid(endMeta));
        const errors = toFieldErrors([...(startMeta?.errors ?? []), ...(endMeta?.errors ?? [])]);
        const startText = typeof startValue === 'string' ? startValue : undefined;
        const endText = typeof endValue === 'string' ? endValue : undefined;
        const text = startText
          ? endText
            ? `${formatDay(startText)} - ${formatDay(endText)}`
            : formatDay(startText)
          : undefined;

        return (
          <Field className={fieldClassName} data-invalid={invalid}>
            <FieldLabel id={`${id}-label`} htmlFor={id}>
              {label}
            </FieldLabel>
            <div className="flex items-center gap-1">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      id={id}
                      type="button"
                      variant="outline"
                      disabled={disabled}
                      aria-invalid={invalid}
                      aria-describedby={describedBy(id, {
                        hasDescription: description != null,
                        invalid,
                      })}
                      className={cn(
                        'min-w-0 flex-1 justify-between font-normal',
                        !text && 'text-muted-foreground',
                      )}
                    />
                  }
                >
                  <span className="truncate">{text ?? placeholder ?? t('placeholder')}</span>
                  <IconChevronDown aria-hidden />
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="max-h-(--available-height) w-auto max-w-(--available-width) flex-col gap-0 overflow-auto p-0! sm:flex-row"
                >
                  <div className="flex flex-row flex-wrap gap-1 border-b p-2 sm:flex-col sm:border-r sm:border-b-0">
                    {PRESETS.map((preset) => (
                      <Button
                        key={`${preset.key}-${preset.months ?? ''}`}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                        onClick={() => {
                          const start = from ?? today;
                          setRange({ from: start, to: preset.to(start) });
                        }}
                      >
                        {t(`presets.${preset.key}`, { count: preset.months ?? 0 })}
                      </Button>
                    ))}
                  </div>
                  <Calendar
                    mode="range"
                    numberOfMonths={twoMonths ? 2 : 1}
                    captionLayout="dropdown"
                    startMonth={startMonth}
                    endMonth={endMonth}
                    selected={{ from, to }}
                    defaultMonth={from}
                    locale={dateFnsLocale(locale)}
                    onSelect={setRange}
                  />
                </PopoverContent>
              </Popover>
              {text && !disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t('clear')}
                  onClick={() => setRange(undefined)}
                >
                  <IconX />
                </Button>
              )}
            </div>
            {description != null && (
              <FieldDescription id={`${id}-description`}>{description}</FieldDescription>
            )}
            {invalid && <FieldError id={`${id}-error`} errors={errors} />}
          </Field>
        );
      }}
    </form.Subscribe>
  );
}
