'use client';

import { isSessionExpired, subscribeSessionExpired } from '@athene-x/whimui/api';
import { useSyncExternalStore } from 'react';

import { loginPath } from '@/lib/auth-urls';

/**
 * Listens to the kit's session-expired store: any 401 through the app client flips it once.
 * A real app shows a dialog here (web-development ch. 07 §6); the demo shows a banner.
 */
export function SessionExpiredBanner() {
  const expired = useSyncExternalStore(subscribeSessionExpired, isSessionExpired, () => false);
  if (!expired) return null;

  return (
    <div className="panel banner" role="alert">
      <strong>Session expired.</strong> A request to <code>/api/v1</code> answered 401 and{' '}
      <code>markSessionExpired()</code> ran.{' '}
      <a href={loginPath(window.location.href)}>Log in again</a> or reload the page to clear this
      banner.
    </div>
  );
}
