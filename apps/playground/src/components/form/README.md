# Reusable forms

Import `useAppForm` from `@/hooks/use-app-form` and `Form` from
`@/components/form/form`. Pass the form to `<Form form={form}>`, then render
inputs inside `form.AppField`. The shared hook registers every field and the
`SubmitButton` component.

```tsx
'use client';

import { z } from 'zod';

import { Form } from '@/components/form/form';
import { useAppForm } from '@/hooks/use-app-form';

const schema = z.object({ email: z.email('Enter a valid email.') });

export function EmailForm() {
  const form = useAppForm({
    defaultValues: { email: '' },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      await saveEmail(schema.parse(value));
    },
  });

  return (
    <Form form={form} className="space-y-6">
      <form.AppField name="email">
        {(field) => <field.EmailField label="Email" required />}
      </form.AppField>
      <form.SubmitButton submittingText="Saving…">Save</form.SubmitButton>
    </Form>
  );
}
```

Await your API call in `onSubmit` so the submit button stays busy. The WhimUI
playground at `/demo/form` shows field examples and submission states.
Demo schemas, fixtures and screens are kept outside the installable registry files.

## Values and validation

| Component                                                                                            | Stored value                                                                          |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `InputField`, `TextField`, `EmailField`, `PasswordField`, `TextareaField`, `InputGroupTextareaField` | `string` (empty: `''`)                                                                |
| `NumberField`                                                                                        | `number` (empty: `undefined`)                                                         |
| `NumberField valueType="string"`                                                                     | Raw numeric `string` (empty: `''`)                                                    |
| `NumberField mode="pattern" format="###-###-####"`                                                   | Raw digit `string`, preserving leading zeros (empty: `''`)                            |
| `ComboboxField`, `RadioGroupField`                                                                   | Option value as `string` (empty: `''`)                                                |
| `SwitchField`                                                                                        | `boolean`                                                                             |
| `CheckboxGroupField`                                                                                 | Checked option values as `string[]` (empty: `[]`)                                     |
| `DateField`                                                                                          | Date `string`: `YYYY-MM-DD` (empty: `''`)                                             |
| `TimeField`                                                                                          | Time `string`: `HH:mm`, with seconds when enabled (empty: `''`)                       |
| `DateTimeField`                                                                                      | Local date-time `string`: `YYYY-MM-DDTHH:mm`, with seconds when enabled (empty: `''`) |

Fields support `label`, `description`, `required`, `id`, `fieldClassName`, and
their underlying input's display props. `className` styles the input;
`fieldClassName` styles the wrapper. State and change/blur handlers are managed
by TanStack Form. Errors appear after a field is touched or submission is attempted,
with accessible links to descriptions and errors.

Use Zod schemas directly in TanStack `validators` at form or field level. No
adapter is required. `required` marks the UI; express validation rules in Zod.
An `onChange` schema also runs on submit, so it does not need repeating under
`onSubmit`. `Form` defaults to `noValidate` so native browser validation does not
bypass the shared errors, submits through `form.handleSubmit`, and resets TanStack
state with a native reset button. Handle submission through `useAppForm({ onSubmit })`.
Zod transformations do not change the form's stored values; call `schema.parse(value)`
in your submit handler when you need parsed or transformed output.

Numeric formatting props such as `thousandSeparator`, `decimalScale`, `prefix`,
`suffix`, `isAllowed`, and pattern `mask` are passed to React Number Format. Use
string storage for identifiers and values that must preserve digit precision.

## Date and time fields

`DateField`, `TimeField`, and `DateTimeField` use native `date`, `time`, and
`datetime-local` inputs. They share the same labels, descriptions, blur handling,
and validation errors as `InputField`. Browser locale controls their display;
stored values use the formats above. Initialize them with `''` or a matching
formatted string. Clearing stores `''`.

Pass native `min`, `max`, `step`, `disabled`, and `readOnly` props as needed.
`step` is measured in days for dates and seconds for time/date-time inputs;
use `step={60}` for minute precision or `step={1}` for seconds. Express bounds
in your Zod schema as well because the form defaults to `noValidate`.

```tsx
const schema = z.object({
  date: z.iso.date('Enter a valid date.'),
  time: z.iso.time({ precision: -1, error: 'Enter a valid time.' }),
  dateTime: z.iso.datetime({ local: true, precision: -1, error: 'Enter a valid date and time.' }),
});

<form.AppField name="date">
  {(field) => <field.DateField label="Date" min="2026-01-01" required />}
</form.AppField>
<form.AppField name="time">
  {(field) => <field.TimeField label="Time" step={60} required />}
</form.AppField>
<form.AppField name="dateTime">
  {(field) => <field.DateTimeField label="Date and time" step={60} required />}
</form.AppField>
```

The example schemas require a value with minute precision. For optional values,
use `z.union([z.literal(''), schema])`; for second precision use `precision: 0`.
Date-time values carry no timezone or UTC offset. Convert them explicitly in
your submit handler if your API requires an instant in a particular timezone.

## Checkbox group

`CheckboxGroupField` takes `{ value, label, group?, disabled? }` options. Options
that share a `group` are listed together under that name, in the order the groups
first appear; options without one are listed with no heading. `layout="grid"`
renders each group as a bordered card in a responsive grid instead of one
column, the same layout `PermissionGrid` uses for read-only permissions.

## Server search combobox

Client mode filters `options` locally. Server mode disables local filtering and
passes typed/cleared search text to `onSearchChange`. The caller owns fetching,
debouncing, request cancellation, and stale response handling, so it can use the
existing React Query setup or another data source.

```tsx
<form.AppField name="department">
  {(field) => (
    <field.ComboboxField
      label="Department"
      mode="server"
      options={results}
      onSearchChange={setSearch}
      loading={isFetching}
      searchError={isError ? 'Could not load departments.' : undefined}
      selectedOption={currentDepartment}
      placeholder="Search departments…"
      emptyText="No departments found."
      hasMore={hasNextPage}
      loadingMore={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  )}
</form.AppField>
```

Use `{ value: string, label: string, disabled?: boolean }` options. Supply
`selectedOption` for an initial or externally changed value that is outside the
current results. Selections made in the control retain their label across result
updates. Clearing stores `''`. Loading and search error messages replace results
to prevent selecting stale options. Search errors are separate from validation
errors. Changing or selecting a label programmatically does not trigger a search.

For paged results, pass every loaded page in `options` with `hasMore`. Scrolling
near the end of the list calls `onLoadMore`, unless `loadingMore` is set;
`loadingMoreText` is shown below the list meanwhile.

## Custom fields and composition

`form-context.ts` exports `fieldContext`, `formContext`, `useFieldContext`, and
`useFormContext` for extensions. `withForm` and `withFieldGroup` are exported from
`use-app-form.ts` for composing larger forms.

To add a field component, read the value with `useFieldContext<T>()` and pass the
component's props to `useFieldControl`. It returns `fieldProps` for `FormField`,
`controlProps` (`id`, `name`, `aria-invalid`, `aria-describedby`) for the control,
and `inputProps`, the remaining props for the underlying input. Register the
component in `use-app-form.ts`.

```tsx
export function SliderField(props: FormFieldProps & SliderProps) {
  const field = useFieldContext<number>();
  const { fieldProps, controlProps, inputProps } = useFieldControl(props);

  return (
    <FormField {...fieldProps}>
      <Slider
        {...inputProps}
        {...controlProps}
        value={field.state.value}
        onValueChange={field.handleChange}
        onBlur={field.handleBlur}
      />
    </FormField>
  );
}
```

For a one-off control, use `field.FormField` inside `form.AppField`. Pass a unique
`id` matching your control; attach its value, `field.handleChange`, and
`field.handleBlur`, and connect `aria-invalid` and `aria-describedby`.

`field-state.ts` holds the pure helpers behind validity, error messages, and
`aria-describedby`.
