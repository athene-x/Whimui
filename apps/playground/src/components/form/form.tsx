'use client';

import type { ComponentProps, ComponentType, PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

export type FormProps = Omit<ComponentProps<'form'>, 'onSubmit' | 'action'> & {
  layout?: 'page' | 'page-wide' | 'default';
  form: {
    AppForm: ComponentType<PropsWithChildren>;
    handleSubmit: () => Promise<void>;
    reset: () => void;
  };
};

export function Form({
  form,
  children,
  onReset,
  layout = 'default',
  className,
  ...props
}: FormProps) {
  return (
    <form.AppForm>
      <form
        noValidate
        {...props}
        className={cn(layout !== 'default' && '@container w-full', className)}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        onReset={(event) => {
          onReset?.(event);
          if (!event.defaultPrevented) {
            event.preventDefault();
            form.reset();
          }
        }}
      >
        {children}
      </form>
    </form.AppForm>
  );
}
