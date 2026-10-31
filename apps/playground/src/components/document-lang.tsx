'use client';

import { useEffect } from 'react';

/** Sets `<html lang>` for a subtree whose language differs from the root layout's. */
export function DocumentLang({ lang }: { lang: string }) {
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.lang;
    html.lang = lang;
    return () => {
      html.lang = previous;
    };
  }, [lang]);

  return null;
}
