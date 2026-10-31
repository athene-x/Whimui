'use client';

import type { ReactNode } from 'react';

import { useEffect, useState } from 'react';

export function PreviewTheme({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.classList.contains('dark');
    root.classList.toggle('dark', dark);
    return () => {
      root.classList.toggle('dark', previous);
    };
  }, [dark]);
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={dark} onChange={(event) => setDark(event.target.checked)} />
        Dark preview
      </label>
      <div className={dark ? 'dark' : undefined}>
        <div className="@container rounded-xl border bg-background p-6 text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
