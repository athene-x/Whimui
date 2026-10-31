'use client';

import type { ReactNode } from 'react';

import { useFieldContext } from '@whimui/core/form';

import { cn } from '@/lib/utils';

import { FormField, useFieldControl, type FormFieldProps } from './form-field';

export type SegmentedOption = { value: string; label: ReactNode; disabled?: boolean };

export type SegmentedFieldProps = FormFieldProps & {
  options: readonly SegmentedOption[];
  disabled?: boolean;
  className?: string;
};

/**
 * The mock's segmented control (เพศ: ชาย | หญิง): equal segments in one bordered row, the chosen
 * one filled chrome green. Radios underneath for keyboard and screen readers.
 */
export function SegmentedField(props: SegmentedFieldProps) {
  const field = useFieldContext<string>();
  const { fieldProps, controlProps, inputProps } = useFieldControl(props);
  const { options, disabled, className } = inputProps;
  const value = field.state.value ?? '';

  return (
    <FormField {...fieldProps}>
      <div
        role="radiogroup"
        id={controlProps.id}
        aria-labelledby={fieldProps.label != null ? `${controlProps.id}-label` : undefined}
        aria-invalid={controlProps['aria-invalid']}
        aria-describedby={controlProps['aria-describedby']}
        className={cn(
          'flex overflow-hidden rounded-md border border-input bg-card',
          controlProps['aria-invalid'] && 'border-critical',
          className,
        )}
      >
        {options.map((option, index) => {
          const checked = option.value === value;
          const id = `${controlProps.id}-${index}`;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cn(
                'flex h-[42px] flex-1 cursor-pointer items-center justify-center border-r border-input text-base transition-colors last:border-r-0 has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-inset',
                checked && 'bg-sidebar font-bold text-sidebar-foreground',
                (disabled || option.disabled) && 'cursor-not-allowed opacity-50',
              )}
            >
              <input
                id={id}
                type="radio"
                name={controlProps.name}
                value={option.value}
                checked={checked}
                disabled={disabled || option.disabled}
                onChange={() => field.handleChange(option.value)}
                onBlur={field.handleBlur}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </FormField>
  );
}
