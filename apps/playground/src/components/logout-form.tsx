'use client';

import { type ReactNode, useState } from 'react';

export type LogoutFormProps = {
  /** The app's logout route (a POST that ends the Better Auth + Keycloak session). */
  action?: string;
  className?: string;
  /** Renders the button and gets the pending state. */
  children: (pending: boolean) => ReactNode;
};

export function LogoutForm({ action = '/api/auth/logout', className, children }: LogoutFormProps) {
  const [pending, setPending] = useState(false);

  return (
    <form
      action={action}
      method="post"
      className={className}
      onSubmit={(event) => {
        if (pending) event.preventDefault();
        else setPending(true);
      }}
    >
      {children(pending)}
    </form>
  );
}
