'use client';

import type { ComponentProps } from 'react';

import NextLink from 'next/link';

import { useBaseHref } from '@/components/base-path-provider';

export type AppLinkProps = ComponentProps<typeof NextLink>;

/** `next/link` that honours the nearest `BasePathProvider`. */
export function AppLink({ href, ...props }: AppLinkProps) {
  const baseHref = useBaseHref();

  return <NextLink href={typeof href === 'string' ? baseHref(href) : href} {...props} />;
}
