'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type ConfirmDialogProps = {
  open: boolean;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  pending?: boolean;
  /** Keeps the confirm button disabled, e.g. until a required reason is typed. */
  disabled?: boolean;
  error?: string;
  /** Extra controls between the description and the buttons (e.g. a reason field). */
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

/** "Are you sure?" dialog for a row action; shows the request error inline and stays open on failure. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  pending = false,
  disabled = false,
  error,
  children,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const t = useTranslations('ui');

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t('actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? 'destructive' : 'default'}
            disabled={pending || disabled}
            aria-busy={pending}
            onClick={onConfirm}
          >
            {pending ? t('status.processing') : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
