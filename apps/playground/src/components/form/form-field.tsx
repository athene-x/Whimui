'use client';

import type { ComponentProps } from 'react';

import {
  isFieldInvalid,
  toFieldErrors,
  useFieldContext,
  type FormFieldProps,
} from '@athene-x/whimui/form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';

// The hook and props type live in the kit; re-exported so field components import one module.
export { useFieldControl, type FormFieldProps } from '@athene-x/whimui/form';

export function FormField({
  id,
  label,
  description,
  required,
  fieldClassName,
  children,
  ...props
}: FormFieldProps & { id: string } & Omit<ComponentProps<typeof Field>, 'className'>) {
  const field = useFieldContext<unknown>();
  const invalid = isFieldInvalid(field.state.meta);

  return (
    <Field className={fieldClassName} data-invalid={invalid} {...props}>
      {label != null && (
        <FieldLabel id={`${id}-label`} htmlFor={id}>
          {label}
          {required && <span aria-hidden="true">*</span>}
        </FieldLabel>
      )}
      {children}
      {description != null && (
        <FieldDescription id={`${id}-description`}>{description}</FieldDescription>
      )}
      {invalid && <FieldError id={`${id}-error`} errors={toFieldErrors(field.state.meta.errors)} />}
    </Field>
  );
}
