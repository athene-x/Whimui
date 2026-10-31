'use client';

import { IconLanguage, IconSelector } from '@tabler/icons-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { LanguageSwitcherItems, LanguageSwitcherMenu } from '@/components/language-switcher-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { setLocale } from '@/i18n/actions';
import { type Locale, locales } from '@/i18n/config';

// Expects the app's `src/i18n/config.ts` (locales, Locale) and `src/i18n/actions.ts`
// (`setLocale` server action that writes the locale cookie).

function useLocaleMenu() {
  const t = useTranslations('ui');
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  const choose = (next: Locale) => {
    if (next !== locale) startTransition(() => setLocale(next));
  };

  const options = locales.map((option) => ({
    locale: option,
    label: t(`languages.${option}`),
    onChoose: () => choose(option),
  }));

  return { t, locale, pending, options };
}

/** Header variant: the globe button. */
export function LocaleSwitcher() {
  const { t, locale, pending, options } = useLocaleMenu();

  return (
    <LanguageSwitcherMenu
      locale={locale}
      label={t('language')}
      pending={pending}
      options={options}
    />
  );
}

/** Sidebar variant: a menu item with the current language. */
export function SidebarLocaleSwitcher() {
  const { t, locale, pending, options } = useLocaleMenu();
  const { isMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              tooltip={t('language')}
              aria-label={t('language')}
              disabled={pending}
              aria-busy={pending}
            />
          }
        >
          {pending ? <Spinner /> : <IconLanguage />}
          <span className="flex-1 truncate">{t(`languages.${locale}`)}</span>
          <IconSelector className="ml-auto group-data-[collapsible=icon]:hidden" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isMobile ? 'bottom' : 'right'}
          align="end"
          sideOffset={8}
          className="min-w-40"
        >
          <LanguageSwitcherItems locale={locale} options={options} pending={pending} />
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
