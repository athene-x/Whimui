'use client';

import { z } from 'zod';

import { Form } from '@/components/form/form';
import { FieldGroup } from '@/components/ui/field';
import { useAppForm } from '@/hooks/use-app-form';

const exampleSchema = z.object({
  name: z.string().min(1, 'Enter your name.'),
  email: z.email('Enter a valid email.'),
  website: z.union([z.literal(''), z.url('Enter a valid URL.')]),
  password: z.string().min(8, 'Use at least 8 characters.'),
  amount: z.number('Enter an amount.').min(0, 'Amount must be positive.'),
  phone: z.string().regex(/^\d{10}$/, 'Enter 10 digits.'),
  department: z.string().min(1, 'Select a department.'),
  contactMethod: z.enum(['email', 'phone']),
  notifications: z.boolean(),
  topics: z.array(z.string()).min(1, 'Select at least one topic.'),
  notes: z.string().max(500, 'Use at most 500 characters.'),
  date: z.iso.date('Enter a valid date.'),
  time: z.iso.time({ precision: -1, error: 'Enter a valid time.' }),
  dateTime: z.iso.datetime({ local: true, precision: -1, error: 'Enter a valid date and time.' }),
});

export type ExampleFormValues = z.infer<typeof exampleSchema>;

// A usage reference; mount it wherever a form is needed and provide your submit handler.
export function FormExample({
  onSubmit,
}: {
  onSubmit: (value: ExampleFormValues) => void | Promise<void>;
}) {
  const form = useAppForm({
    defaultValues: {
      name: '',
      email: '',
      website: '',
      password: '',
      amount: undefined as number | undefined,
      phone: '',
      department: '',
      contactMethod: 'email',
      notifications: false,
      topics: [] as string[],
      notes: '',
      date: '',
      time: '',
      dateTime: '',
    },
    validators: { onChange: exampleSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(exampleSchema.parse(value));
    },
  });

  return (
    <Form form={form} className="space-y-6">
      <FieldGroup>
        <form.AppField name="name">
          {(field) => <field.TextField label="Name" autoComplete="name" required />}
        </form.AppField>
        <form.AppField name="email">
          {(field) => <field.EmailField label="Email" required />}
        </form.AppField>
        <form.AppField name="website">
          {(field) => <field.InputField label="Website" type="url" />}
        </form.AppField>
        <form.AppField name="password">
          {(field) => <field.PasswordField label="Password" autoComplete="new-password" required />}
        </form.AppField>
        <form.AppField name="amount">
          {(field) => (
            <field.NumberField
              label="Amount"
              thousandSeparator
              decimalScale={2}
              allowNegative={false}
              required
            />
          )}
        </form.AppField>
        <form.AppField name="phone">
          {(field) => (
            <field.NumberField
              label="Phone"
              mode="pattern"
              format="###-###-####"
              mask="_"
              type="tel"
              required
            />
          )}
        </form.AppField>
        <form.AppField name="department">
          {(field) => (
            <field.ComboboxField
              label="Department"
              required
              options={[
                { value: 'engineering', label: 'Engineering' },
                { value: 'operations', label: 'Operations' },
              ]}
            />
          )}
        </form.AppField>
        <form.AppField name="contactMethod">
          {(field) => (
            <field.RadioGroupField
              label="Contact method"
              options={[
                { value: 'email', label: 'Email' },
                { value: 'phone', label: 'Phone' },
              ]}
            />
          )}
        </form.AppField>
        <form.AppField name="notifications">
          {(field) => (
            <field.SwitchField label="Notifications" description="Receive updates by email." />
          )}
        </form.AppField>
        <form.AppField name="topics">
          {(field) => (
            <field.CheckboxGroupField
              label="Topics"
              options={[
                { value: 'releases', label: 'Releases', group: 'Product' },
                { value: 'incidents', label: 'Incidents', group: 'Product' },
                { value: 'invoices', label: 'Invoices', group: 'Billing' },
              ]}
            />
          )}
        </form.AppField>
        <form.AppField name="notes">
          {(field) => <field.TextareaField label="Notes" rows={4} />}
        </form.AppField>
        <form.AppField name="date">
          {(field) => <field.DateField label="Date" required />}
        </form.AppField>
        <form.AppField name="time">
          {(field) => <field.TimeField label="Time" step={60} required />}
        </form.AppField>
        <form.AppField name="dateTime">
          {(field) => <field.DateTimeField label="Date and time" step={60} required />}
        </form.AppField>
      </FieldGroup>
      <form.SubmitButton submittingText="Saving…">Save</form.SubmitButton>
    </Form>
  );
}
