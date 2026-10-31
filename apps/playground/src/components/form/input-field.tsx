'use client';

import type { ComponentProps } from 'react';

import { useFieldContext } from '@athenex/web-core/form';

import { Input } from '@/components/ui/input';

import { FormField, useFieldControl, type FormFieldProps } from './form-field';

export type InputFieldProps = FormFieldProps &
  Omit<
    ComponentProps<typeof Input>,
    'id' | 'name' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'children'
  >;
export type TypedInputFieldProps = Omit<InputFieldProps, 'type'>;

export function InputField(props: InputFieldProps) {
  const field = useFieldContext<string>();
  const { fieldProps, controlProps, inputProps } = useFieldControl(props);

  return (
    <FormField {...fieldProps}>
      <Input
        {...inputProps}
        {...controlProps}
        value={field.state.value ?? ''}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
      />
    </FormField>
  );
}

export function TextField(props: TypedInputFieldProps) {
  return <InputField {...props} type="text" />;
}

export function EmailField(props: TypedInputFieldProps) {
  return <InputField autoComplete="email" {...props} type="email" />;
}

export function PasswordField(props: TypedInputFieldProps) {
  return <InputField autoComplete="current-password" {...props} type="password" />;
}

export function DateField(props: TypedInputFieldProps) {
  return <InputField {...props} type="date" />;
}

export function TimeField(props: TypedInputFieldProps) {
  return <InputField {...props} type="time" />;
}

export function DateTimeField(props: TypedInputFieldProps) {
  return <InputField {...props} type="datetime-local" />;
}
