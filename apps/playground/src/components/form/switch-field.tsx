'use client';

import type { ComponentProps } from 'react';

import { useFieldContext } from '@athenex/web-core/form';

import { Switch } from '@/components/ui/switch';

import { FormField, useFieldControl, type FormFieldProps } from './form-field';

export type SwitchFieldProps = FormFieldProps &
  Omit<
    ComponentProps<typeof Switch>,
    'id' | 'name' | 'checked' | 'defaultChecked' | 'onCheckedChange' | 'onBlur' | 'children'
  >;

export function SwitchField(props: SwitchFieldProps) {
  const field = useFieldContext<boolean>();
  const { fieldProps, controlProps, inputProps } = useFieldControl(props);

  return (
    <FormField {...fieldProps}>
      <Switch
        {...inputProps}
        {...controlProps}
        checked={field.state.value ?? false}
        onCheckedChange={(checked) => field.handleChange(checked)}
        onBlur={field.handleBlur}
      />
    </FormField>
  );
}
