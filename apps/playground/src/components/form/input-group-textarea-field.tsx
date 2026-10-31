'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useFieldContext } from '@athene-x/whimui/form';

import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group';

import { FormField, useFieldControl, type FormFieldProps } from './form-field';

export type InputGroupTextareaFieldProps = FormFieldProps &
  Omit<
    ComponentProps<typeof InputGroupTextarea>,
    'id' | 'name' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'children'
  > & {
    addon?: ReactNode;
    groupClassName?: string;
  };

export function InputGroupTextareaField({
  addon,
  groupClassName,
  ...props
}: InputGroupTextareaFieldProps) {
  const field = useFieldContext<string>();
  const { fieldProps, controlProps, inputProps } = useFieldControl(props);

  return (
    <FormField {...fieldProps}>
      <InputGroup className={groupClassName}>
        <InputGroupTextarea
          {...inputProps}
          {...controlProps}
          value={field.state.value ?? ''}
          onChange={(event) => field.handleChange(event.target.value)}
          onBlur={field.handleBlur}
        />
        {addon && <InputGroupAddon align="block-end">{addon}</InputGroupAddon>}
      </InputGroup>
    </FormField>
  );
}
