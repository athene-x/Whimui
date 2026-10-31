import { DetailItem, DetailList } from '@/components/detail-list';
import { EnumBadge, SEVERITY_CLASS_NAME } from '@/components/enum-badge';
import { PageHeader } from '@/components/page-header';
import { PermissionGrid } from '@/components/permission-grid';
import { SidePanel, SidePanelLayout } from '@/components/side-panel';
import { UserAvatar } from '@/components/user-avatar';

import type { DemoName } from './catalog';

import { severities } from './list-fixtures';

export function DetailsDemo({ name }: { name: DemoName }) {
  if (name === 'page-header')
    return (
      <PageHeader
        title="An example page with a longer title for layout checks"
        subtitle="Supporting description supplied by the app."
      />
    );
  if (name === 'enum-badge')
    return (
      <div className="flex flex-wrap gap-2">
        {severities.map((value) => (
          <EnumBadge key={value} value={value} label={value} classNames={SEVERITY_CLASS_NAME} />
        ))}
      </div>
    );
  if (name === 'user-avatar')
    return (
      <div className="flex gap-4">
        <UserAvatar name="Ann Example" />
        <UserAvatar name="" />
        <UserAvatar name="Image fallback" imageUrl="data:image/png;base64,broken" />
      </div>
    );
  if (name === 'permission-grid')
    return (
      <PermissionGrid
        idPrefix="demo"
        granted={['users:read']}
        options={[
          { value: 'users:read', label: 'View users', group: 'Users' },
          { value: 'users:manage', label: 'Manage users', group: 'Users' },
        ]}
      />
    );
  const details = (
    <DetailList>
      <DetailItem label="Owner">Ann Example</DetailItem>
      <DetailItem label="Status">
        <EnumBadge value="High" label="High" classNames={SEVERITY_CLASS_NAME} />
      </DetailItem>
      <DetailItem label="Description">
        A longer value that wraps as the available width changes.
      </DetailItem>
    </DetailList>
  );
  if (name === 'side-panel')
    return (
      <SidePanelLayout>
        <SidePanel title="Owner details">{details}</SidePanel>
        <p className="text-sm">Main content. Resize the window to try the collapsible panel.</p>
      </SidePanelLayout>
    );
  return details;
}
