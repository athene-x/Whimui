import { decodeJwt } from 'jose';

/** Reads a JWT payload without verifying it; `null` when the token is not a well-formed JWT. */
export function decodeJwtPayload<Payload>(token: string): Payload | null {
  try {
    return decodeJwt(token) as Payload;
  } catch {
    return null;
  }
}
