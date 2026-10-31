'use client';

import type { ComponentProps } from 'react';

import { useFieldContext } from '@athenex/web-core/form';

import { Textarea } from '@/components/ui/textarea';

import { FormField, useFieldControl, type FormFieldProps } from './form-field';

export type TextareaFieldProps = FormFieldProps &
  Omit<
    ComponentProps<typeof Textarea>,
    'id' | 'name' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'children'
  >;

export function TextareaField(props: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const { fieldProps, controlProps, inputProps } = useFieldControl(props);

  return (
    <FormField {...fieldProps}>
      <Textarea
        {...inputProps}
        {...controlProps}
        value={field.state.value ?? ''}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
      />
    </FormField>
  );
}
