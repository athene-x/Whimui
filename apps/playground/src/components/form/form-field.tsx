'use client';

import { describedBy, isFieldInvalid, toFieldErrors, useFieldContext } from '@athene-x/whimui/form';
import { useId, type ComponentProps, type ReactNode } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';

export type FormFieldProps = {
  id?: string;
  label?: ReactNode;
  description?: ReactNode;
  required?: boolean;
  fieldClassName?: string;
};

type LayoutKey = 'id' | 'label' | 'description' | 'fieldClassName';
type InputPropsOf<TProps> = TProps extends unknown ? Omit<TProps, LayoutKey> : never;

export function useFieldControl<TProps extends FormFieldProps>(props: TProps) {
  const { id: idProp, label, description, fieldClassName, ...inputProps } = props;
  const generatedId = useId();
  const field = useFieldContext<unknown>();
  const id = idProp ?? generatedId;
  const invalid = isFieldInvalid(field.state.meta);

  return {
    fieldProps: { id, label, description, fieldClassName, required: props.required },
    controlProps: {
      id,
      name: field.name,
      'aria-invalid': invalid,
      'aria-describedby': describedBy(id, { hasDescription: description != null, invalid }),
    },
    inputProps: inputProps as unknown as InputPropsOf<TProps>,
  };
}

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
