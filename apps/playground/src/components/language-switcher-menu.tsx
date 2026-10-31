'use client';

import { IconCheck, IconSelector, IconWorld } from '@tabler/icons-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export type LanguageOption = {
  locale: string;
  label: string;
} & ({ href: string; onChoose?: never } | { href?: never; onChoose: () => void });

export type LanguageSwitcherMenuProps = {
  locale: string;
  label: string;
  options: LanguageOption[];
  pending?: boolean;
  className?: string;
};

export function LanguageSwitcherItems({
  locale,
  options,
  pending = false,
}: Pick<LanguageSwitcherMenuProps, 'locale' | 'options' | 'pending'>) {
  return options.map((option) => (
    <DropdownMenuItem
      key={option.locale}
      lang={option.locale}
      render={
        option.href !== undefined ? (
          <Link href={option.href} hrefLang={option.locale} lang={option.locale} />
        ) : undefined
      }
      onClick={option.onChoose}
      disabled={pending}
      aria-current={option.locale === locale ? 'true' : undefined}
    >
      <span className="w-6 text-xs font-semibold text-muted-foreground uppercase">
        {option.locale}
      </span>
      <span className="flex-1">{option.label}</span>
      {option.locale === locale && <IconCheck className="ml-auto" />}
    </DropdownMenuItem>
  ));
}

/** Globe button that opens the language list; items are links (public pages) or callbacks. */
export function LanguageSwitcherMenu({
  locale,
  label,
  options,
  pending = false,
  className,
}: LanguageSwitcherMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn('shrink-0 text-foreground', className)}
            aria-label={label}
            disabled={pending}
            aria-busy={pending}
          />
        }
      >
        {pending ? <Spinner /> : <IconWorld className="text-primary" />}
        <span className="uppercase">{locale}</span>
        <IconSelector />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-40">
        <LanguageSwitcherItems locale={locale} options={options} pending={pending} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
