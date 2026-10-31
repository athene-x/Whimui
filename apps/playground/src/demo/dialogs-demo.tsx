'use client';

import { useState } from 'react';

import { AppDialog } from '@/components/app-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';

import { waitForPreview } from './list-fixtures';

export function DialogsDemo({ confirmation = false }: { confirmation?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('normal');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState('');

  async function confirm() {
    setPending(true);
    setError(undefined);
    await waitForPreview();
    setPending(false);
    if (mode === 'error') setError('Simulated failure. Review the message and try again.');
    else {
      setOpen(false);
      setMessage('Confirmed locally. No item was deleted.');
    }
  }

  return (
    <div className="space-y-4">
      {confirmation && (
        <label className="flex items-center gap-2 text-sm">
          Confirm state
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            className="rounded-md border bg-background p-2"
          >
            <option value="normal">Normal → pending → success</option>
            <option value="disabled">Disabled</option>
            <option value="error">Submit error</option>
          </select>
        </label>
      )}
      <Button
        onClick={() => {
          setError(undefined);
          setOpen(true);
        }}
      >
        Open {confirmation ? 'confirmation' : 'dialog'}
      </Button>
      <p role="status" className="text-sm">
        {message}
      </p>
      {confirmation ? (
        <ConfirmDialog
          open={open}
          title="Delete sample item?"
          description="This is a preview; no data is deleted."
          confirmLabel="Confirm"
          destructive
          pending={pending}
          disabled={mode === 'disabled'}
          error={error}
          onConfirm={() => void confirm()}
          onClose={() => {
            if (!pending) setOpen(false);
          }}
        />
      ) : (
        open && (
          <AppDialog
            title="Sample dialog"
            description="Content is owned by the consuming app."
            onClose={() => setOpen(false)}
          >
            <p className="text-sm">Press Escape, use the close button, or finish below.</p>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </AppDialog>
        )
      )}
    </div>
  );
}
