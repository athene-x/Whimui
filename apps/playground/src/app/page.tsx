import { useTranslations } from 'next-intl';

import { AppLink } from '@/components/app-link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const t = useTranslations('playground');

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <PageHeader title={t('title')} subtitle="Every registry item, mounted once.">
        <Button nativeButton={false} render={<AppLink href="/demo" />}>
          Open demo
        </Button>
      </PageHeader>
      <p className="text-sm text-muted-foreground">
        Registry items live under <code>src/components</code>; <code>registry.json</code> lists them
        and <code>pnpm registry:build</code> writes <code>public/r/*.json</code>.
      </p>
    </main>
  );
}
