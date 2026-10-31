'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useFieldContext } from '@athenex/web-core/form';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';

import { Checkbox } from '@/components/ui/checkbox';
import { FieldDescription, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

import {
  CHECKBOX_GROUP_LAYOUTS,
  type CheckboxGroupLayout,
  groupOptions,
} from './checkbox-group-options';
import { FormField, useFieldControl, type FormFieldProps } from './form-field';

export type CheckboxGroupOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  group?: string;
  disabled?: boolean;
};

export type CheckboxGroupFieldProps = FormFieldProps &
  Omit<
    ComponentProps<typeof CheckboxGroup>,
    'id' | 'value' | 'defaultValue' | 'onValueChange' | 'onBlur' | 'children'
  > & { options: readonly CheckboxGroupOption[]; layout?: CheckboxGroupLayout };

export function CheckboxGroupField(props: CheckboxGroupFieldProps) {
  const field = useFieldContext<string[]>();
  const { fieldProps, controlProps, inputProps } = useFieldControl(props);
  const { options, layout = 'list', required, className, ...groupProps } = inputProps;
  const classes = CHECKBOX_GROUP_LAYOUTS[layout];
  const { name, ...groupControlProps } = controlProps;

  return (
    <FormField {...fieldProps}>
      <CheckboxGroup
        {...groupProps}
        {...groupControlProps}
        data-slot="checkbox-group"
        aria-labelledby={fieldProps.label != null ? `${controlProps.id}-label` : undefined}
        aria-required={required}
        className={cn(classes.groups, className)}
        value={field.state.value ?? []}
        onValueChange={(value) => field.handleChange(value)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) field.handleBlur();
        }}
      >
        {groupOptions(options).map((group) => (
          <div key={group.name ?? ''} className={classes.group}>
            {group.name != null && (
              <p className="text-sm font-medium text-muted-foreground">{group.name}</p>
            )}
            {group.options.map((option) => {
              const optionId = `${controlProps.id}-${option.value}`;

              return (
                <div key={option.value} className="flex items-start gap-2">
                  <Checkbox
                    id={optionId}
                    name={name}
                    value={option.value}
                    className="mt-0.5"
                    disabled={groupProps.disabled || option.disabled}
                    aria-invalid={controlProps['aria-invalid']}
                  />
                  <div className="flex flex-col gap-0.5">
                    <FieldLabel htmlFor={optionId}>{option.label}</FieldLabel>
                    {option.description != null && (
                      <FieldDescription className="text-xs">{option.description}</FieldDescription>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </CheckboxGroup>
    </FormField>
  );
}
