'use client';

import { useFieldContext } from '@athene-x/whimui/form';
import {
  NumericFormat,
  PatternFormat,
  type NumericFormatProps,
  type PatternFormatProps,
  type SourceInfo,
} from 'react-number-format';

import { Input } from '@/components/ui/input';

import { FormField, useFieldControl, type FormFieldProps } from './form-field';

type ManagedProps =
  | 'id'
  | 'name'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'onValueChange'
  | 'onBlur'
  | 'customInput'
  | 'displayType'
  | 'valueIsNumericString';
export type NumberFieldProps = FormFieldProps &
  (
    | (Omit<NumericFormatProps, ManagedProps> & {
        mode?: 'number';
        valueType?: 'number' | 'string';
      })
    | (Omit<PatternFormatProps, ManagedProps> & { mode: 'pattern'; valueType?: 'string' })
  );

export function NumberField(props: NumberFieldProps) {
  const field = useFieldContext<number | string | undefined>();
  const { fieldProps, controlProps, inputProps } = useFieldControl(props);
  const stringValue = inputProps.mode === 'pattern' || inputProps.valueType === 'string';
  const shared = {
    ...controlProps,
    customInput: Input,
    value: field.state.value ?? '',
    valueIsNumericString: true,
    onBlur: field.handleBlur,
    onValueChange: (values: { value: string; floatValue?: number }, source: SourceInfo) => {
      if (source.source === 'event') {
        field.handleChange(stringValue ? values.value : values.floatValue);
      }
    },
  };

  if (inputProps.mode === 'pattern') {
    const { mode: _mode, valueType: _valueType, ...formatProps } = inputProps;
    return (
      <FormField {...fieldProps}>
        <PatternFormat {...formatProps} {...shared} />
      </FormField>
    );
  }
  const { mode: _mode, valueType: _valueType, ...formatProps } = inputProps;
  return (
    <FormField {...fieldProps}>
      <NumericFormat {...formatProps} {...shared} />
    </FormField>
  );
}
