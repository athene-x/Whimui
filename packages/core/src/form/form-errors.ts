import { ApiError } from '../api/api';

export type FieldErrorRules<TField extends string> = Record<
  string,
  { field: TField; message: string }
>;

export type SubmitError<TField extends string> =
  | { fields: Partial<Record<TField, string>>; message?: undefined }
  | { fields?: undefined; message: string };

/**
 * Turns a failed submit into field errors (codes matched by `rules`) or one message.
 * `unexpectedMessage` is shown for anything that is not an `ApiError` (e.g. a thrown TypeError).
 */
export function toSubmitError<TField extends string = never>(
  error: unknown,
  unexpectedMessage: string,
  rules: FieldErrorRules<TField> = {},
): SubmitError<TField> {
  if (!(error instanceof ApiError)) return { message: unexpectedMessage };

  const codes = [error.code, ...error.errors.map((detail) => detail.code)];
  const fields: Partial<Record<TField, string>> = {};
  for (const code of codes) {
    const rule = Object.hasOwn(rules, code) ? rules[code] : undefined;
    if (rule && !Object.hasOwn(fields, rule.field)) {
      Object.defineProperty(fields, rule.field, {
        value: rule.message,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
  }

  return Object.keys(fields).length > 0
    ? { fields }
    : { message: error.message || unexpectedMessage };
}

/** One message for a failed request: the mapped code, else the API's description, else `fallback`. */
export function describeError(
  error: unknown,
  messages: Record<string, string> = {},
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!(error instanceof ApiError)) return fallback;

  const codes = [error.code, ...error.errors.map((detail) => detail.code)];
  for (const code of codes) {
    const message = Object.hasOwn(messages, code) ? messages[code] : undefined;
    if (message) return message;
  }

  return error.message || fallback;
}
