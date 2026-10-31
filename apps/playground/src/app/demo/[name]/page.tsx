import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { AppBreadcrumb } from '@/components/app-breadcrumb';
import { AppLink } from '@/components/app-link';
import { AppShell } from '@/components/app-shell';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { PageHeader } from '@/components/page-header';
import { demoItems, isDemoName } from '@/demo/catalog';
import { Preview } from '@/demo/preview';
import { PreviewTheme } from '@/demo/preview-theme';
import { DemoSidebar } from '@/demo/shell-demo';

export default async function ComponentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!isDemoName(name)) notFound();
  const item = demoItems.find((entry) => entry.name === name);
  if (!item) notFound();
  const body = (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <AppLink href="/demo" className="text-sm underline">
        ← Component catalog
      </AppLink>
      <PageHeader title={item.title ?? item.name} subtitle={item.example.description}>
        <LocaleSwitcher />
      </PageHeader>
      <section aria-label="Interactive preview">
        <PreviewTheme>
          <Suspense fallback={<p role="status">Loading preview…</p>}>
            <Preview name={name} />
          </Suspense>
        </PreviewTheme>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Usage</h2>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
          <code>{item.example.code}</code>
        </pre>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Props and requirements</h2>
        <p className="text-sm">{item.example.props}</p>
        <p className="text-sm text-muted-foreground">
          For complete TypeScript props, see the source files below. Registry items assume the app
          contract described in the repository README.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Install</h2>
        <p className="text-sm">After configuring the @whimui registry URL in your app:</p>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
          <code>{`pnpm dlx shadcn add @whimui/${item.name}`}</code>
        </pre>
        <p className="text-sm">
          npm dependencies:{' '}
          {'dependencies' in item ? item.dependencies?.join(', ') : 'None beyond the host app.'}
        </p>
        <p className="text-sm">
          Registry dependencies:{' '}
          {'registryDependencies' in item ? item.registryDependencies?.join(', ') : 'None.'}
        </p>
        <p className="text-sm text-muted-foreground">
          Dependencies listed here are direct requirements; shadcn also installs their registry
          dependencies. Registry hosting is not configured yet.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Source files</h2>
        <ul className="list-inside list-disc text-sm">
          {'files' in item &&
            item.files?.map((file) => (
              <li key={file.path}>
                <code>{file.path}</code>
              </li>
            ))}
          {item.type === 'registry:theme' && <li>Theme variables are defined in registry.json.</li>}
        </ul>
      </section>
    </main>
  );

  if (name !== 'app-shell') return body;
  return (
    <AppShell
      sidebar={<DemoSidebar />}
      breadcrumb={
        <AppBreadcrumb
          routes={[
            { pattern: '/demo', label: 'Catalog' },
            { pattern: '/demo/app-shell', label: 'App shell' },
          ]}
        />
      }
      actions={<LocaleSwitcher />}
    >
      {body}
    </AppShell>
  );
}
