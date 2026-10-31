import { AppLink } from '@/components/app-link';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { PageHeader } from '@/components/page-header';
import { demoGroups, demoItems } from '@/demo/catalog';

export default function DemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <PageHeader
        title="Component catalog"
        subtitle="Choose an item to view its preview, usage and installation dependencies."
      >
        <LocaleSwitcher />
      </PageHeader>
      <p className="text-sm text-muted-foreground">
        This playground documents registry components. Application structure and CRUD conventions
        live in apps/starter.
      </p>
      {demoGroups.map((group) => (
        <section key={group} className="space-y-4">
          <h2 className="text-lg font-semibold">{group}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {demoItems
              .filter((item) => item.example.group === group)
              .map((item) => (
                <AppLink
                  key={item.name}
                  href={`/demo/${item.name}`}
                  className="rounded-xl border p-4 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <h3 className="font-medium">{item.title ?? item.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.example.description}</p>
                </AppLink>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
