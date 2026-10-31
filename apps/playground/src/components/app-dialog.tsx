'use client';

import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type AppDialogProps = {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  onClose: () => void;
  children: ReactNode;
};

/** An always-open dialog: mount it to show it, `onClose` unmounts it. */
export function AppDialog({ title, description, className, onClose, children }: AppDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
