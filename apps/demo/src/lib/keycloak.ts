import 'server-only';

import { createKeycloak, type Keycloak } from '@athene-x/whimui/auth';

import { env } from './env';

let instance: Keycloak | undefined;

/** Realm URLs with the public/internal split (`@athene-x/whimui/auth`). */
export function keycloak(): Keycloak {
  return (instance ??= createKeycloak({
    issuer: env().AUTH_ISSUER,
    internalIssuer: env().AUTH_ISSUER_INTERNAL,
  }));
}
