import { ApiError } from '../api/api';
import { apiErrorCodes } from '../api/api-errors';

/** @deprecated Import `describeError` from `@athene-x/whimui/api`; it is about requests, not forms. */
export { describeError } from '../api/api-errors';

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
 * The first matching code wins per field.
 */
export function toSubmitError<TField extends string = never>(
  error: unknown,
  unexpectedMessage: string,
  rules: FieldErrorRules<TField> = {},
): SubmitError<TField> {
  if (!(error instanceof ApiError)) return { message: unexpectedMessage };

  const fields = new Map<TField, string>();
  for (const code of apiErrorCodes(error)) {
    const rule = Object.hasOwn(rules, code) ? rules[code] : undefined;
    if (rule && !fields.has(rule.field)) fields.set(rule.field, rule.message);
  }

  return fields.size > 0
    ? { fields: Object.fromEntries(fields) as Partial<Record<TField, string>> }
    : { message: error.message || unexpectedMessage };
}

/** The part of a TanStack `FormApi` that `applySubmitError` uses. */
export type SubmitErrorForm<TField extends string> = {
  setErrorMap: (errorMap: { onSubmit: { fields: Partial<Record<TField, string>> } }) => void;
};

/**
 * Shows a `SubmitError` on the form. Field errors become each field's `onSubmit` error
 * (TanStack clears it when that field changes); a form-level message is returned for the
 * caller to render, so `setSubmitError(applySubmitError(formApi, result))` covers both.
 */
export function applySubmitError<TField extends string>(
  form: SubmitErrorForm<TField>,
  result: SubmitError<TField>,
): string | undefined {
  if (result.fields) {
    form.setErrorMap({ onSubmit: { fields: result.fields } });
    return undefined;
  }
  return result.message;
}
