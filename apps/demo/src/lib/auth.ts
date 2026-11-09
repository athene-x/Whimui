import 'server-only';

import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { genericOAuth, keycloak } from 'better-auth/plugins/generic-oauth';

import { COOKIE_PREFIX } from './auth-urls';
import { env } from './env';
import { appUrl } from './site';

export const KEYCLOAK_PROVIDER_ID = 'keycloak';

/** Web session lifetime; must not exceed the realm's ssoSessionMaxLifespan (36000 s). */
export const SESSION_MAX_AGE = 60 * 60 * 8;

/**
 * Better Auth without a database, the way the team's apps run it: the session lives in an
 * encrypted (JWE) cookie and the Keycloak tokens in the signed account cookie. The browser
 * only ever sees those cookies, never a token.
 */
function createAuth() {
  const config = env();
  const origin = appUrl().origin;

  return betterAuth({
    baseURL: origin,
    secret: config.AUTH_SECRET,
    trustedOrigins: [origin],
    session: {
      expiresIn: SESSION_MAX_AGE,
      cookieCache: {
        enabled: true,
        maxAge: SESSION_MAX_AGE,
        strategy: 'jwe',
        refreshCache: true,
      },
    },
    account: {
      storeStateStrategy: 'cookie',
      storeAccountCookie: true,
    },
    advanced: {
      cookiePrefix: COOKIE_PREFIX,
      useSecureCookies: appUrl().protocol === 'https:',
    },
    plugins: [
      genericOAuth({
        config: [
          keycloak({
            clientId: config.AUTH_CLIENT_ID,
            clientSecret: config.AUTH_CLIENT_SECRET,
            // Server-to-server: discovery, code exchange and refresh go to the internal issuer.
            issuer: config.AUTH_ISSUER_INTERNAL ?? config.AUTH_ISSUER,
          }),
        ],
      }),
      nextCookies(),
    ],
  });
}

let instance: ReturnType<typeof createAuth> | undefined;

export function auth() {
  return (instance ??= createAuth());
}
