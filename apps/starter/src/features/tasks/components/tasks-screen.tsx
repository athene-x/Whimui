'use client';

import { describeError } from '@athene-x/whimui/api';
import {
  useListQuery,
  useListTable,
  type ColumnDef,
  type ListTableFeatures,
} from '@athene-x/whimui/list-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { deleteTaskMutation, tasksQuery } from '../queries';
import type { Task } from '../schemas';
import { TaskForm } from './task-form';

const columns: ColumnDef<ListTableFeatures, Task>[] = [
  { accessorKey: 'title' },
  { accessorKey: 'completed' },
];

export function TasksScreen() {
  const t = useTranslations('tasks');
  const list = useListQuery<'title'>({ size: 5, sort: { field: 'title' } });
  const query = useQuery(tasksQuery(list.params));
  const table = useListTable({
    list,
    columns,
    result: query.data,
    isPlaceholderData: query.isPlaceholderData,
  });
  const removal = useMutation(deleteTaskMutation());
  const [editor, setEditor] = useState<Task | 'new' | null>(null);
  const totalPages = Math.max(query.data?.totalPages ?? 1, 1);

  function remove(task: Task) {
    if (window.confirm(t('confirmDelete'))) removal.mutate(task.id);
  }

  return (
    <section>
      <h1>{t('title')}</h1>
      <p>{t('demo')}</p>
      <div className="actions">
        <label htmlFor="task-search">{t('search')}</label>
        <input
          id="task-search"
          type="search"
          value={list.searchInput}
          onChange={(event) => list.setSearchInput(event.target.value)}
        />
        <button onClick={() => setEditor('new')}>{t('add')}</button>
      </div>
      {editor !== null && (
        <TaskForm
          key={editor === 'new' ? 'new' : editor.id}
          task={editor === 'new' ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
      {removal.isError && <p role="alert">{describeError(removal.error, {}, t('failed'))}</p>}
      {query.isError && (
        <div role="alert">
          <p>{describeError(query.error, {}, t('failed'))}</p>
          <button onClick={() => void query.refetch()}>{t('retry')}</button>
        </div>
      )}
      {query.isPending ? (
        <p role="status">{t('loading')}</p>
      ) : (
        query.data && (
          <>
            {query.isFetching && <p role="status">{t('refreshing')}</p>}
            <table aria-busy={query.isFetching}>
              <caption>{t('title')}</caption>
              <thead>
                <tr>
                  <th aria-sort={list.sort?.descending ? 'descending' : 'ascending'}>
                    <button onClick={() => list.toggleSort('title')}>{t('name')}</button>
                  </th>
                  <th>{t('completed')}</th>
                  <th>
                    <span className="sr-only">{t('edit')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.map(({ original: task }) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.completed ? t('completed') : t('pending')}</td>
                    <td className="actions">
                      <button disabled={query.isPlaceholderData} onClick={() => setEditor(task)}>
                        {t('edit')}
                      </button>
                      <button
                        disabled={removal.isPending || query.isPlaceholderData}
                        onClick={() => remove(task)}
                      >
                        {t('remove')}
                      </button>
                    </td>
                  </tr>
                ))}
                {query.data.items.length === 0 && (
                  <tr>
                    <td colSpan={3}>{t('empty')}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <nav className="actions" aria-label={t('title')}>
              <button
                disabled={list.page <= 1 || query.isPlaceholderData}
                onClick={() => list.setPage(list.page - 1)}
              >
                {t('previous')}
              </button>
              <span>{t('page', { page: list.page, total: totalPages })}</span>
              <button
                disabled={list.page >= totalPages || query.isPlaceholderData}
                onClick={() => list.setPage(list.page + 1)}
              >
                {t('next')}
              </button>
            </nav>
          </>
        )
      )}
    </section>
  );
}
