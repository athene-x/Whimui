import Link from 'next/link';

import { END_KEYCLOAK_SESSION_PATH, loginPath, LOGOUT_PATH } from '@/lib/auth-urls';

import type { AuthCheck, AuthOverview } from '../types';

type AuthPanelProps = AuthOverview & { ended?: string };

export function AuthPanel({ state, checks, serverCall, events, config, ended }: AuthPanelProps) {
  const active = state.kind === 'active';

  return (
    <section>
      <h1>Auth</h1>
      {ended === 'both' && (
        <p className="panel" role="status">
          Logged out of the web app and Keycloak (front-channel, with <code>id_token_hint</code>).
        </p>
      )}
      {ended === 'keycloak' && (
        <p className="panel" role="status">
          Only the Keycloak session was ended. The web cookies are still in your browser, so the
          state below should read <code>revoked</code> and the back-channel log should show the
          logout token Keycloak sent.
        </p>
      )}

      <div className="panel">
        <h2>Session</h2>
        {state.kind === 'none' && <p>Not logged in.</p>}
        {state.kind === 'tokens-unavailable' && (
          <p role="alert">
            Logged in as {state.user.email}, but Keycloak refused to refresh the tokens (refresh
            token expired or revoked). Log out and in again.
          </p>
        )}
        {state.kind === 'revoked' && (
          <p role="alert">
            Keycloak ended session <code>{state.sid}</code> of {state.user.email} through
            back-channel logout. The cookie is now ignored; log in again.
          </p>
        )}
        {active && (
          <p>
            Logged in as <strong>{state.user.name}</strong> ({state.user.email}), user id{' '}
            <code>{state.user.id}</code>, Keycloak session <code>{state.sid ?? '-'}</code>.
          </p>
        )}
        <div className="actions">
          {!active && <a href={loginPath('/auth')}>Log in with Keycloak</a>}
          {active && (
            <>
              <form method="post" action={LOGOUT_PATH}>
                <button type="submit">Log out (web + Keycloak)</button>
              </form>
              <form method="post" action={END_KEYCLOAK_SESSION_PATH}>
                <button type="submit">
                  End the Keycloak session only (tests back-channel logout)
                </button>
              </form>
            </>
          )}
          <Link href="/auth/protected">Protected page</Link>
          <Link href="/api-lab">API lab</Link>
        </div>
      </div>

      <div className="panel">
        <h2>Checks</h2>
        <table>
          <tbody>
            {checks.map((check) => (
              <tr key={check.label}>
                <td>
                  <CheckBadge check={check} />
                </td>
                <td>{check.label}</td>
                <td>
                  <code>{check.value}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>Server-side API call</h2>
        <p className="muted">
          <code>createServerApiClient</code> + <code>authorizeWith</code> calling{' '}
          <code>GET {config.apiBaseUrl}/api/v1/me</code> during this render. The fake API verifies
          the token against the realm&apos;s JWKS and requires <code>aud</code>{' '}
          <code>{config.audience}</code>.
        </p>
        {serverCall.kind === 'ok' ? (
          <pre>{JSON.stringify(serverCall.me, null, 2)}</pre>
        ) : (
          <p role={active ? 'alert' : undefined}>
            <span className={`badge ${active ? 'badge-fail' : 'badge-info'}`}>
              {serverCall.status} {serverCall.code}
            </span>{' '}
            {serverCall.message}
            {!active && ' (expected while logged out: authorizeWith fails before sending)'}
          </p>
        )}
      </div>

      <div className="panel">
        <h2>Back-channel logout log</h2>
        <p className="muted">
          Keycloak POSTs a logout token to <code>/api/auth/backchannel-logout</code> when it ends a
          session; <code>handleBackchannelLogout</code> verifies it and revokes the <code>sid</code>
          . In-memory, newest first, resets with the dev server.
        </p>
        {events.length === 0 ? (
          <p>No calls received yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Status</th>
                <th>sid</th>
                <th>sub</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={`${event.at}-${event.sid ?? ''}`}>
                  <td>{event.at}</td>
                  <td>
                    <span className={`badge ${event.status === 200 ? 'badge-pass' : 'badge-fail'}`}>
                      {event.status}
                    </span>
                  </td>
                  <td>
                    <code>{event.sid ?? '-'}</code>
                  </td>
                  <td>
                    <code>{event.sub ?? '-'}</code>
                  </td>
                  <td>{event.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h2>Configuration in use</h2>
        <table>
          <tbody>
            <tr>
              <td>AUTH_ISSUER (public)</td>
              <td>
                <code>{config.issuer}</code>
              </td>
            </tr>
            <tr>
              <td>AUTH_ISSUER_INTERNAL</td>
              <td>
                <code>{config.internalIssuer}</code>
              </td>
            </tr>
            <tr>
              <td>AUTH_CLIENT_ID</td>
              <td>
                <code>{config.clientId}</code>
              </td>
            </tr>
            <tr>
              <td>API_AUDIENCE</td>
              <td>
                <code>{config.audience}</code>
              </td>
            </tr>
            <tr>
              <td>API_BASE_URL</td>
              <td>
                <code>{config.apiBaseUrl}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CheckBadge({ check }: { check: AuthCheck }) {
  if (check.ok === null) return <span className="badge badge-info">info</span>;
  return (
    <span className={`badge ${check.ok ? 'badge-pass' : 'badge-fail'}`}>
      {check.ok ? 'pass' : 'fail'}
    </span>
  );
}
