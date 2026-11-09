import type { BackchannelEvent } from '@/lib/backchannel-log';
import type { SessionState } from '@/lib/session';

export type AuthCheck = {
  label: string;
  /** `null` means informational only. */
  ok: boolean | null;
  value: string;
};

export type ServerCallResult =
  | { kind: 'ok'; me: Record<string, unknown> }
  | { kind: 'error'; status: number; code: string; message: string };

export type AuthOverview = {
  state: SessionState;
  hasCookie: boolean;
  checks: AuthCheck[];
  serverCall: ServerCallResult;
  events: BackchannelEvent[];
  config: {
    issuer: string;
    internalIssuer: string;
    clientId: string;
    audience: string;
    apiBaseUrl: string;
  };
};
