'use client';

import { ApiError, apiErrorBody } from '@athenex/web-core/api';
import { useState } from 'react';

import { ErrorAlert } from '@/components/error-alert';
import { ErrorPage } from '@/components/error-page';
import { LoadError } from '@/components/load-error';
import { LoadingPage } from '@/components/loading-page';
import { LoadingText } from '@/components/loading-text';
import { NotFoundPage } from '@/components/not-found-page';
import { StatusPage } from '@/components/status-page';

const previewError = new Error('Deliberate playground route-error preview.');
const requestError = new ApiError(503, apiErrorBody('Demo.Unavailable', 'Simulated API failure.'));

export function FeedbackDemo({ pages = false }: { pages?: boolean }) {
  const [state, setState] = useState('empty');
  const [attempts, setAttempts] = useState(0);

  if (!pages)
    return (
      <div className="grid gap-6">
        <LoadingText />
        <LoadingPage />
        <LoadError error={requestError} />
        <ErrorAlert message="A sample form could not be saved." />
      </div>
    );

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        Page state
        <select
          value={state}
          onChange={(event) => setState(event.target.value)}
          className="rounded-md border bg-background p-2"
        >
          <option value="empty">Empty</option>
          <option value="not-found">Not found</option>
          <option value="error">Error</option>
        </select>
      </label>
      {state === 'empty' && (
        <StatusPage title="No items yet" description="Add an item to get started." />
      )}
      {state === 'not-found' && <NotFoundPage homeHref="/demo" />}
      {state === 'error' && (
        <>
          <ErrorPage error={previewError} retry={() => setAttempts((value) => value + 1)} />
          <p role="status" className="text-sm">
            Retry callback called {attempts} times.
          </p>
        </>
      )}
    </div>
  );
}
