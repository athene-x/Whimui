'use client';

import { useState } from 'react';

import { type LabContext, type Outcome, type Scenario, scenarios } from '../scenarios';

type RunState = { status: 'idle' } | { status: 'running' } | ({ status: 'done' } & Outcome);

export function ApiLabScreen({ loggedIn, audience }: LabContext) {
  const [results, setResults] = useState<Record<string, RunState>>({});
  const [runningAll, setRunningAll] = useState(false);

  async function run(scenario: Scenario) {
    setResults((current) => ({ ...current, [scenario.id]: { status: 'running' } }));
    let outcome: Outcome;
    try {
      outcome = await scenario.run({ loggedIn, audience });
    } catch (error) {
      outcome = {
        ok: false,
        detail: `threw ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`,
      };
    }
    setResults((current) => ({ ...current, [scenario.id]: { status: 'done', ...outcome } }));
  }

  async function runAll() {
    setRunningAll(true);
    try {
      await Promise.all(scenarios.filter((scenario) => !scenario.sideEffect).map(run));
    } finally {
      setRunningAll(false);
    }
  }

  const done = Object.values(results).filter((r): r is RunState & Outcome => r.status === 'done');
  const failed = done.filter((r) => !r.ok).length;

  return (
    <section>
      <h1>API lab</h1>
      <p>
        Scenarios run in this browser with the kit&apos;s <code>createApiClient</code>. Most hit the
        fake API at <code>/mock/api/v1</code> directly; the BFF scenario goes through{' '}
        <code>/api/v1</code>, where the server attaches your Keycloak token. You are currently{' '}
        <strong>{loggedIn ? 'logged in' : 'logged out'}</strong>.
      </p>
      <div className="actions">
        <button onClick={() => void runAll()} disabled={runningAll}>
          {runningAll ? 'Running…' : 'Run all (no side effects)'}
        </button>
        {done.length > 0 && (
          <span className={`badge ${failed ? 'badge-fail' : 'badge-pass'}`} role="status">
            {done.length - failed}/{done.length} passed
          </span>
        )}
      </div>
      <table>
        <caption>Scenarios</caption>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Covers</th>
            <th>Result</th>
            <th>
              <span className="sr-only">Run</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((scenario) => {
            const state = results[scenario.id] ?? { status: 'idle' };
            return (
              <tr key={scenario.id}>
                <td>
                  {scenario.title}
                  {scenario.sideEffect && <p className="muted">{scenario.sideEffect}</p>}
                </td>
                <td>
                  <code>{scenario.covers}</code>
                </td>
                <td>
                  <StatusBadge state={state} />
                  {state.status === 'done' && <pre>{state.detail}</pre>}
                </td>
                <td>
                  <button onClick={() => void run(scenario)} disabled={state.status === 'running'}>
                    Run
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function StatusBadge({ state }: { state: RunState }) {
  switch (state.status) {
    case 'idle':
      return <span className="badge badge-idle">not run</span>;
    case 'running':
      return <span className="badge badge-info">running…</span>;
    case 'done':
      return (
        <span className={`badge ${state.ok ? 'badge-pass' : 'badge-fail'}`}>
          {state.ok ? 'pass' : 'fail'}
        </span>
      );
  }
}
