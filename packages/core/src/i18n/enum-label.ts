type LabelTranslator = {
  (key: never): string;
  has(key: never): boolean;
};

export function labelOf(
  t: LabelTranslator,
  value: string | null | undefined,
  fallback = '-',
): string {
  if (value == null) return fallback;

  const key = value as never;
  return t.has(key) ? t(key) : value;
}
