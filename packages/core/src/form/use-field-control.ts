'use client';

import { useId, type ReactNode } from 'react';

import { describedBy, isFieldInvalid } from './field-state';
import { useFieldContext } from './form-context';

/** Layout props every field component accepts; the rest of its props go to the input. */
export type FormFieldProps = {
  id?: string;
  label?: ReactNode;
  description?: ReactNode;
  required?: boolean;
  fieldClassName?: string;
};

type LayoutKey = 'id' | 'label' | 'description' | 'fieldClassName';
type InputPropsOf<TProps> = TProps extends unknown ? Omit<TProps, LayoutKey> : never;

/**
 * Splits a field component's props and wires the control to the current TanStack field:
 * `fieldProps` for the label/description/error frame, `controlProps` (`id`, `name`,
 * `aria-invalid`, `aria-describedby`) for the control, `inputProps` for everything else.
 */
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
