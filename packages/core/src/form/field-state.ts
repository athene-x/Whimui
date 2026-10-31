export type FieldErrorMessage = { message: string };

export function isFieldInvalid(meta: { isTouched: boolean; isValid: boolean }) {
  return meta.isTouched && !meta.isValid;
}

export function toFieldErrors(errors: readonly unknown[]): FieldErrorMessage[] {
  return errors.flatMap((error) => {
    if (typeof error === 'string') return [{ message: error }];
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return [{ message: error.message }];
    }
    return [];
  });
}

export function describedBy(id: string, state: { hasDescription: boolean; invalid: boolean }) {
  const ids = [
    state.hasDescription ? `${id}-description` : undefined,
    state.invalid ? `${id}-error` : undefined,
  ].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}
