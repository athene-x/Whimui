'use client';

import { isSessionExpired, subscribeSessionExpired } from '@athene-x/whimui/api';
import { IconClockExclamation } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState, useSyncExternalStore } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';

export type SessionExpiredDialogProps = {
  /** The app's login route; the current URL is passed as `returnToParam`. */
  loginPath?: string;
  returnToParam?: string;
};

/**
 * Shown when an API call answers 401 (`createApiClient` marks the session expired): the login
 * has ended, so the user signs in again and comes back to the same page.
 */
export function SessionExpiredDialog({
  loginPath = '/api/auth/login',
  returnToParam = 'returnTo',
}: SessionExpiredDialogProps) {
  const t = useTranslations('ui.sessionExpired');
  const expired = useSyncExternalStore(subscribeSessionExpired, isSessionExpired, () => false);
  const [pending, setPending] = useState(false);

  if (!expired) return null;

  const params = new URLSearchParams({ [returnToParam]: window.location.href });
  const href = `${loginPath}?${params}`;

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <IconClockExclamation />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            nativeButton={false}
            disabled={pending}
            aria-busy={pending}
            render={
              <a href={href} onClick={() => setPending(true)}>
                {pending && <Spinner />}
                {pending ? t('redirecting') : t('action')}
              </a>
            }
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
