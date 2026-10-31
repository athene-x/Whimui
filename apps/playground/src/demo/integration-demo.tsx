'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { markSessionExpired } from '@whimui/core/api';
import { useSearchParams } from 'next/navigation';

import { LogoutForm } from '@/components/logout-form';
import { SessionExpiredDialog } from '@/components/session-expired-dialog';
import { Button } from '@/components/ui/button';

import { waitForPreview } from './list-fixtures';

export function SessionDemo() {
  return (
    <div className="space-y-4">
      <Button onClick={markSessionExpired}>Simulate session expiry</Button>
      <p className="text-sm text-muted-foreground">
        The dialog action reloads this preview. No login request is made.
      </p>
      <SessionExpiredDialog loginPath="/demo/session-expired-dialog" />
    </div>
  );
}

export function LogoutDemo() {
  const params = useSearchParams();
  return (
    <div className="space-y-4">
      <LogoutForm action="/demo/logout">
        {(pending) => (
          <Button type="submit" disabled={pending}>
            {pending ? 'Posting preview…' : 'Try logout POST'}
          </Button>
        )}
      </LogoutForm>
      {params.get('submitted') === '1' && (
        <p role="status" className="text-sm">
          Preview POST received. No session was changed.
        </p>
      )}
    </div>
  );
}

export function QueryDemo() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['playground', 'query-provider'],
    queryFn: async ({ signal }) => {
      await waitForPreview(signal);
      return 'Local query completed.';
    },
  });
  return (
    <div className="space-y-4">
      <p role="status" className="text-sm">
        {query.isFetching ? 'Fetching local preview…' : query.data}
      </p>
      <Button
        disabled={query.isFetching}
        onClick={() =>
          void client.invalidateQueries({ queryKey: ['playground', 'query-provider'] })
        }
      >
        Invalidate and refetch
      </Button>
    </div>
  );
}
