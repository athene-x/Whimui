'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useFieldContext } from '@whimui/core/form';

import { FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { FormField, useFieldControl, type FormFieldProps } from './form-field';

export type RadioGroupOption = { value: string; label: ReactNode; disabled?: boolean };
export type RadioGroupFieldProps = FormFieldProps &
  Omit<
    ComponentProps<typeof RadioGroup>,
    'id' | 'name' | 'value' | 'defaultValue' | 'onValueChange' | 'onBlur' | 'children'
  > & { options: readonly RadioGroupOption[] };

export function RadioGroupField(props: RadioGroupFieldProps) {
  const field = useFieldContext<string>();
  const { fieldProps, controlProps, inputProps } = useFieldControl(props);
  const { options, required, ...groupProps } = inputProps;

  return (
    <FormField {...fieldProps}>
      <RadioGroup
        {...groupProps}
        {...controlProps}
        aria-labelledby={fieldProps.label != null ? `${controlProps.id}-label` : undefined}
        aria-required={required}
        value={field.state.value ?? ''}
        onValueChange={(value) => field.handleChange(value as string)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) field.handleBlur();
        }}
      >
        {options.map((option, index) => (
          <div key={option.value} className="flex items-center gap-2">
            <RadioGroupItem
              id={`${controlProps.id}-${index}`}
              value={option.value}
              disabled={groupProps.disabled || option.disabled}
              aria-invalid={controlProps['aria-invalid']}
            />
            <FieldLabel htmlFor={`${controlProps.id}-${index}`}>{option.label}</FieldLabel>
          </div>
        ))}
      </RadioGroup>
    </FormField>
  );
}
