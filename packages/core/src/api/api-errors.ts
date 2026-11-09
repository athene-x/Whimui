import { ApiError } from './api';

/** The error's codes in matching order: the envelope's own code, then each detail's code. */
export function apiErrorCodes(error: ApiError): string[] {
  return [error.code, ...error.errors.map((detail) => detail.code)];
}

/** One message for a failed request: the mapped code, else the API's description, else `fallback`. */
export function describeError(
  error: unknown,
  messages: Record<string, string> = {},
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!(error instanceof ApiError)) return fallback;

  for (const code of apiErrorCodes(error)) {
    const message = Object.hasOwn(messages, code) ? messages[code] : undefined;
    if (message) return message;
  }

  return error.message || fallback;
}
