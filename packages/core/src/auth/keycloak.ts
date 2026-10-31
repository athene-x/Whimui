export const KEYCLOAK_ENDPOINTS = {
  authorize: '/protocol/openid-connect/auth',
  registrations: '/protocol/openid-connect/registrations',
  token: '/protocol/openid-connect/token',
  userinfo: '/protocol/openid-connect/userinfo',
  endSession: '/protocol/openid-connect/logout',
  jwks: '/protocol/openid-connect/certs',
} as const;

export type KeycloakEndpoint = keyof typeof KEYCLOAK_ENDPOINTS;

export type KeycloakConfig = {
  /** Public realm issuer, e.g. `https://auth.example.com/realms/app` (what the browser sees). */
  issuer: string;
  /** Issuer as reachable from the server (e.g. `http://keycloak:8080/realms/app` in docker). */
  internalIssuer?: string;
};

export type Keycloak = {
  issuer: string;
  internalIssuer: string;
  url: (endpoint: KeycloakEndpoint, options?: { internal?: boolean }) => URL;
};

/**
 * Realm URLs with the public/internal split Keycloak itself makes in its discovery document
 * (KC_HOSTNAME_BACKCHANNEL_DYNAMIC): browser-facing endpoints use the public issuer, the
 * back-channel ones (token, JWKS) the internal one.
 */
export function createKeycloak(config: KeycloakConfig): Keycloak {
  const issuer = trimSlash(config.issuer);
  const internalIssuer = trimSlash(config.internalIssuer ?? config.issuer);

  return {
    issuer,
    internalIssuer,
    url: (endpoint, options) =>
      new URL(`${options?.internal ? internalIssuer : issuer}${KEYCLOAK_ENDPOINTS[endpoint]}`),
  };
}

function trimSlash(url: string): string {
  return url.replace(/\/$/, '');
}
