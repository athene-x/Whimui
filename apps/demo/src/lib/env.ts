import 'server-only';

import { z } from 'zod';

const schema = z.object({
  /** Where the browser reaches this app; Keycloak's redirect URI is built from it. */
  APP_URL: z.url().default('http://localhost:3002'),
  /** The API behind `/api/v1`. May carry a path prefix (the demo's fake API lives at `/mock`). */
  API_BASE_URL: z.url().optional(),
  /** Audience the API requires in access tokens: the audience mapper on the web client. */
  API_AUDIENCE: z.string().min(1).default('demo-api'),
  AUTH_SECRET: z.string().min(32, 'at least 32 characters: openssl rand -base64 32'),
  AUTH_CLIENT_ID: z.string().min(1).default('demo-web'),
  AUTH_CLIENT_SECRET: z.string().min(1),
  /** Public realm issuer: what the browser sees and what `iss` in every token must equal. */
  AUTH_ISSUER: z.url(),
  /** Realm issuer as the server reaches it; equals AUTH_ISSUER when nothing sits in between. */
  AUTH_ISSUER_INTERNAL: z.url().optional(),
});

export type Env = Omit<z.infer<typeof schema>, 'API_BASE_URL'> & { API_BASE_URL: string };

let cached: Env | undefined;

/** Validated environment, read once. Throws with every problem listed when `.env` is incomplete. */
export function env(): Env {
  if (cached) return cached;
  const raw = Object.fromEntries(
    Object.keys(schema.shape)
      .map((key) => [key, process.env[key]] as const)
      .filter(([, value]) => value !== undefined && value !== ''),
  );
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `apps/demo: invalid environment. Copy .env.example to .env and fill it in.\n${z.prettifyError(parsed.error)}`,
    );
  }
  const { API_BASE_URL, ...rest } = parsed.data;
  cached = { ...rest, API_BASE_URL: API_BASE_URL ?? `${rest.APP_URL}/mock` };
  return cached;
}
