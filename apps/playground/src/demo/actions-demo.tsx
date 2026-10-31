'use client';

import { IconPencil, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';

import { RowActions } from '@/components/row-actions';

export function ActionsDemo() {
  const [message, setMessage] = useState('Choose an action.');
  const actions = [
    {
      key: 'edit',
      icon: <IconPencil />,
      label: 'Edit',
      onSelect: () => setMessage('Edit selected locally.'),
    },
    {
      key: 'delete',
      icon: <IconTrash />,
      label: 'Delete',
      destructive: true,
      separator: true,
      onSelect: () => setMessage('Delete selected locally; no data was removed.'),
    },
  ];
  return (
    <div className="space-y-4">
      <RowActions label="Manage sample item" actions={actions} />
      <div className="flex flex-wrap gap-2">
        <RowActions inHeader label="Manage sample item" actions={actions} />
      </div>
      <p role="status" className="text-sm">
        {message}
      </p>
    </div>
  );
}
