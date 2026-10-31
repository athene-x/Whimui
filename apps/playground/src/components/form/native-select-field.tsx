'use client';

import type { ComponentProps } from 'react';

import { useFieldContext } from '@athene-x/whimui/form';

import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

import { FormField, useFieldControl, type FormFieldProps } from './form-field';

export type NativeSelectOptionItem = { value: string; label: string; disabled?: boolean };

export type NativeSelectFieldProps = FormFieldProps &
  Omit<
    ComponentProps<typeof NativeSelect>,
    'id' | 'name' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'children'
  > & {
    options: readonly NativeSelectOptionItem[];
    /** Text of the empty option; omit to force a choice from `options`. */
    placeholder?: string;
  };

/** Native `<select>` with the shared label/description/error frame (best on phones). */
export function NativeSelectField(props: NativeSelectFieldProps) {
  const field = useFieldContext<string>();
  const { fieldProps, controlProps, inputProps } = useFieldControl(props);
  const { options, placeholder, className, ...selectProps } = inputProps;

  return (
    <FormField {...fieldProps}>
      <NativeSelect
        {...selectProps}
        {...controlProps}
        className={className ?? 'w-full'}
        value={field.state.value ?? ''}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
      >
        {placeholder !== undefined && (
          <NativeSelectOption value="">{placeholder}</NativeSelectOption>
        )}
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </FormField>
  );
}
