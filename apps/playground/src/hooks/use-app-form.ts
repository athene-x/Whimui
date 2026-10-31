'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@whimui/core/form';

import { CheckboxGroupField } from '@/components/form/checkbox-group-field';
import { ComboboxField } from '@/components/form/combobox-field';
import { DateRangeField } from '@/components/form/date-range-field';
import { FormField } from '@/components/form/form-field';
import {
  DateField,
  DateTimeField,
  EmailField,
  InputField,
  PasswordField,
  TextField,
  TimeField,
} from '@/components/form/input-field';
import { InputGroupTextareaField } from '@/components/form/input-group-textarea-field';
import { NativeSelectField } from '@/components/form/native-select-field';
import { NumberField } from '@/components/form/number-field';
import { RadioCardField } from '@/components/form/radio-card-field';
import { RadioGroupField } from '@/components/form/radio-group-field';
import { SegmentedField } from '@/components/form/segmented-field';
import { SubmitButton } from '@/components/form/submit-button';
import { SwitchField } from '@/components/form/switch-field';
import { TextareaField } from '@/components/form/textarea-field';

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    CheckboxGroupField,
    ComboboxField,
    DateField,
    DateTimeField,
    EmailField,
    FormField,
    InputField,
    InputGroupTextareaField,
    NativeSelectField,
    NumberField,
    PasswordField,
    RadioCardField,
    RadioGroupField,
    SegmentedField,
    SwitchField,
    TextareaField,
    TextField,
    TimeField,
  },
  formComponents: { DateRangeField, SubmitButton },
});
