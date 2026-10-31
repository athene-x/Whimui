export type Jwt<Header = Record<string, unknown>, Payload = Record<string, unknown>> = {
  header: Header;
  payload: Payload;
  signingInput: string;
  signature: string;
};

export function parseJwt<Header, Payload>(token: string): Jwt<Header, Payload> | null {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return null;

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

export function decodeJwtPayload<Payload>(token: string): Payload | null {
  const payload = token.split('.')[1];
  return payload ? decodeSegment<Payload>(payload) : null;
}

function decodeSegment<T>(segment: string): T | null {
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}
