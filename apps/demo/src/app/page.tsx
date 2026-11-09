import Link from 'next/link';

export default function HomePage() {
  return (
    <section>
      <h1>What this app tests</h1>
      <p>
        A Next.js-only harness for <code>@athene-x/whimui</code>: the API client against a fake API
        that lives in this app, and the Keycloak BFF helpers against a real Keycloak.
      </p>
      <div className="panel">
        <h2>
          <Link href="/api-lab">API lab</Link>
        </h2>
        <p>
          Runs scenarios in the browser against <code>/mock/api/v1</code>: error envelope to{' '}
          <code>ApiError</code>, field errors, unexpected bodies, timeout, network error,{' '}
          <code>shouldRetry</code>, <code>toListSearchParams</code>, and the BFF&apos;s 401 / bearer
          forwarding depending on whether you are logged in.
        </p>
      </div>
      <div className="panel">
        <h2>
          <Link href="/auth">Auth</Link>
        </h2>
        <p>
          Login through Keycloak (Better Auth, no database), checks on the tokens the BFF holds, a
          server-side API call with <code>createServerApiClient</code>, front-channel logout with{' '}
          <code>id_token_hint</code>, and back-channel logout handled by{' '}
          <code>handleBackchannelLogout</code>.
        </p>
      </div>
      <p className="muted">
        Setup, test user and the automated flow (<code>pnpm --filter demo e2e</code>) are in the app
        README.
      </p>
    </section>
  );
}
