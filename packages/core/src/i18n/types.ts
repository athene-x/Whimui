import type { useFormatter, useTranslations } from 'next-intl';

export type Namespace = NonNullable<Parameters<typeof useTranslations>[0]>;

export type Translator<TNamespace extends Namespace = never> = ReturnType<
  typeof useTranslations<TNamespace>
>;

export type MessageKey<TNamespace extends Namespace = never> = Parameters<
  Translator<TNamespace>
>[0];

export type Formatter = ReturnType<typeof useFormatter>;
