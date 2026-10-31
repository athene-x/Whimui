'use client';

import type { Icon } from '@tabler/icons-react';
import type { ComponentProps, ReactNode } from 'react';

import { useFieldContext } from '@whimui/core/form';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

import { FormField, useFieldControl, type FormFieldProps } from './form-field';

export type RadioCardOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: Icon;
  className?: string;
  iconClassName?: string;
  radioClassName?: string;
  disabled?: boolean;
};

export type RadioCardFieldProps = FormFieldProps &
  Omit<
    ComponentProps<typeof RadioGroup>,
    'id' | 'name' | 'value' | 'defaultValue' | 'onValueChange' | 'onBlur' | 'children'
  > & { options: readonly RadioCardOption[] };

export function RadioCardField(props: RadioCardFieldProps) {
  const field = useFieldContext<string>();
  const { fieldProps, controlProps, inputProps } = useFieldControl(props);
  const { options, required, className, ...groupProps } = inputProps;

  return (
    <FormField {...fieldProps}>
      <RadioGroup
        {...groupProps}
        {...controlProps}
        className={cn('grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-4', className)}
        aria-labelledby={fieldProps.label != null ? `${controlProps.id}-label` : undefined}
        aria-required={required}
        value={field.state.value ?? ''}
        onValueChange={(value) => field.handleChange(value as string)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) field.handleBlur();
        }}
      >
        {options.map((option, index) => {
          const id = `${controlProps.id}-${index}`;
          const OptionIcon = option.icon;

          return (
            <FieldLabel
              key={option.value}
              htmlFor={id}
              className={cn(
                'has-data-checked:bg-primary/5! *:data-[slot=field]:p-4 dark:has-data-checked:bg-primary/10!',
                option.className,
              )}
            >
              <Field
                orientation="horizontal"
                className={cn('min-w-0', option.description == null && 'justify-center')}
              >
                {OptionIcon && (
                  <span
                    className={cn(
                      'flex shrink-0 items-center justify-center [&>svg]:size-6',
                      option.iconClassName,
                    )}
                  >
                    <OptionIcon />
                  </span>
                )}
                <FieldContent className="min-w-0 flex-initial">
                  <FieldTitle className="min-w-0 text-base break-words">{option.label}</FieldTitle>
                  {option.description != null && (
                    <FieldDescription>{option.description}</FieldDescription>
                  )}
                </FieldContent>
                <RadioGroupItem
                  id={id}
                  value={option.value}
                  className={cn('sr-only', option.radioClassName)}
                  disabled={groupProps.disabled || option.disabled}
                  aria-invalid={controlProps['aria-invalid']}
                />
              </Field>
            </FieldLabel>
          );
        })}
      </RadioGroup>
    </FormField>
  );
}
