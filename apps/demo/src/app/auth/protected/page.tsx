import Link from 'next/link';
import { redirect } from 'next/navigation';

import { loginPath } from '@/lib/auth-urls';
import { getSession } from '@/lib/session';

/** Behind the proxy's cookie check; verifies the session itself too (cookies can be revoked). */
export default async function ProtectedPage() {
  const session = await getSession();
  if (!session) redirect(loginPath('/auth/protected'));

  return (
    <section>
      <h1>Protected page</h1>
      <p>
        You are logged in as <strong>{session.user.name}</strong> ({session.user.email}). Without a
        session cookie, <code>proxy.ts</code> sends the browser to the login before this page
        renders; with a revoked session, the page itself redirects.
      </p>
      <Link href="/auth">Back to auth</Link>
    </section>
  );
}
