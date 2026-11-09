'use client';

import { ApiError, apiErrorBody } from '@athene-x/whimui/api';
import { applySubmitError, toSubmitError } from '@athene-x/whimui/form';
import { useState } from 'react';
import { z } from 'zod';

import { ErrorAlert } from '@/components/error-alert';
import { Form } from '@/components/form/form';
import { Button } from '@/components/ui/button';
import { useAppForm } from '@/hooks/use-app-form';

import { FormExample } from './form-example';
import { waitForPreview } from './list-fixtures';

const schema = z.object({ email: z.email('Enter a valid email.') });

type Outcome = 'ok' | 'form-error' | 'field-error';

/** Stands in for the API: a 409 with a code the form maps to the email field, or a plain 500. */
function simulatedFailure(outcome: Outcome) {
  return outcome === 'field-error'
    ? new ApiError(409, apiErrorBody('Demo.EmailTaken', 'That email is already registered.'))
    : new ApiError(
        500,
        apiErrorBody('Demo.SaveFailed', 'Simulated save failure. Your input is retained.'),
      );
}

export function FormsDemo() {
  const [disabled, setDisabled] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>('ok');
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const form = useAppForm({
    defaultValues: { email: '' },
    validators: { onChange: schema },
    onSubmit: async ({ formApi }) => {
      setError(undefined);
      setMessage(undefined);
      await waitForPreview();
      if (outcome === 'ok') {
        setMessage('Saved locally for this preview. No data was sent.');
        return;
      }
      const result = toSubmitError<'email'>(simulatedFailure(outcome), 'Something went wrong.', {
        'Demo.EmailTaken': { field: 'email', message: 'This email is already registered.' },
      });
      setError(applySubmitError(formApi, result));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={disabled}
            onChange={(event) => setDisabled(event.target.checked)}
          />
          Disable field
        </label>
        <label className="flex items-center gap-2">
          Next submit
          <select
            className="rounded-md border bg-background px-2 py-1"
            value={outcome}
            onChange={(event) => setOutcome(event.target.value as Outcome)}
          >
            <option value="ok">succeeds</option>
            <option value="form-error">fails with a form error</option>
            <option value="field-error">fails with an email field error</option>
          </select>
        </label>
      </div>
      <Form form={form} className="max-w-lg space-y-4">
        <form.AppField name="email">
          {(field) => (
            <field.EmailField
              label="Email"
              required
              disabled={disabled}
              description="Submit an invalid address to see validation. A valid submission stays pending briefly; a field error from the API shows here until the value changes."
            />
          )}
        </form.AppField>
        <ErrorAlert message={error} />
        <div className="flex gap-2">
          <form.SubmitButton disabled={disabled} />
          <Button type="reset" variant="outline">
            Reset fields
          </Button>
        </div>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
      </Form>
      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer font-medium">Extended field example</summary>
        <div className="mt-4">
          <FormExample
            onSubmit={async () => {
              await waitForPreview();
              setMessage('All-fields example submitted locally.');
            }}
          />
        </div>
      </details>
    </div>
  );
}
