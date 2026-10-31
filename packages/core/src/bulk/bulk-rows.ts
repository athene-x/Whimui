import type { z } from 'zod';

export type BulkRow<TValues> = TValues & { key: number };

export type BulkIssues<TValues> = Partial<Record<keyof TValues, string>>;

export type BulkOutcome = { done: true } | { done: false; message: string };

export type BulkTable<TValues> = { rows: TValues[]; error?: undefined } | { error: string };

export type BulkImportResult = { errorCode: string | null; errorMessage: string | null };

export const BULK_MAX_ROWS = 1000;
export const BULK_CHUNK_SIZE = 20;

export function withBulkKeys<TValues>(
  values: readonly TValues[],
  start: number,
): BulkRow<TValues>[] {
  return values.map((value, index) => ({ ...value, key: start + index }));
}

export function isBlankBulkRow(row: Record<string, string | number>): boolean {
  return Object.entries(row).every(
    ([field, value]) => field === 'key' || String(value).trim() === '',
  );
}

export function schemaIssues<TValues>(
  result: z.ZodSafeParseResult<unknown>,
  fields: readonly (keyof TValues & string)[],
): BulkIssues<TValues> {
  const issues: BulkIssues<TValues> = {};

  if (result.success) return issues;

  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && fields.includes(field as keyof TValues & string)) {
      issues[field as keyof TValues] ??= issue.message;
    }
  }

  return issues;
}

export function duplicateBulkKeys<TValues>(
  rows: readonly BulkRow<TValues>[],
  identity: (row: BulkRow<TValues>) => string,
): Set<number> {
  const seen = new Set<string>();
  const duplicates = new Set<number>();

  for (const row of rows) {
    const value = identity(row);
    if (value === '') continue;
    if (seen.has(value)) duplicates.add(row.key);
    seen.add(value);
  }

  return duplicates;
}

export function toBulkOutcome(
  result: BulkImportResult,
  translate: (code: string) => string | undefined,
): BulkOutcome {
  if (!result.errorCode) return { done: true };

  return {
    done: false,
    message: translate(result.errorCode) ?? result.errorMessage ?? result.errorCode,
  };
}
