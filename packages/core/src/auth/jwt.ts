export type Jwt<Header = Record<string, unknown>, Payload = Record<string, unknown>> = {
  header: Header;
  payload: Payload;
  signingInput: string;
  signature: string;
};

/** Decodes a signed JWT's structure; does not verify its signature or claims. */
export function parseJwt<Header, Payload>(token: string): Jwt<Header, Payload> | null {
  const segments = token.split('.');
  if (segments.length !== 3) return null;
  const [header, payload, signature] = segments;
  if (!header || !payload || !signature || !isBase64Url(signature)) return null;

  const decodedHeader = decodeSegment<Header>(header);
  const decodedPayload = decodeSegment<Payload>(payload);
  if (!decodedHeader || !decodedPayload) return null;

  return {
    header: decodedHeader,
    payload: decodedPayload,
    signingInput: `${header}.${payload}`,
    signature,
  };
}

/** Reads an unverified payload; use a token verifier before trusting its claims. */
export function decodeJwtPayload<Payload>(token: string): Payload | null {
  return parseJwt<unknown, Payload>(token)?.payload ?? null;
}

function decodeSegment<T>(segment: string): T | null {
  if (!isBase64Url(segment)) return null;

  try {
    const bytes = Buffer.from(segment, 'base64url');
    const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as T)
      : null;
  } catch {
    return null;
  }
}

function isBase64Url(segment: string): boolean {
  return (
    /^[A-Za-z0-9_-]+$/.test(segment) &&
    Buffer.from(segment, 'base64url').toString('base64url') === segment
  );
}
