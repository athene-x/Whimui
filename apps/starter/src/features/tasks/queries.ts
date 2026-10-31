import type { ListQueryParams } from '@athene-x/whimui/list-query';

import { invalidateOnSuccess } from '@athene-x/whimui/api';
import { keepPreviousData, mutationOptions, queryOptions } from '@tanstack/react-query';

import { createTask, deleteTask, listTasks, updateTask } from './api';
import type { TaskInput } from './schemas';

export const taskKeys = {
  all: ['tasks'] as const,
  list: (params: ListQueryParams<'title'>) => [...taskKeys.all, 'list', params] as const,
};

export function tasksQuery(params: ListQueryParams<'title'>) {
  return queryOptions({
    queryKey: taskKeys.list(params),
    queryFn: ({ signal }) => listTasks(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function saveTaskMutation() {
  return mutationOptions({
    mutationFn: ({ id, input }: { id?: string; input: TaskInput }) =>
      id ? updateTask(id, input) : createTask(input),
    onSuccess: invalidateOnSuccess(taskKeys.all),
  });
}

export function deleteTaskMutation() {
  return mutationOptions({
    mutationFn: deleteTask,
    onSuccess: invalidateOnSuccess(taskKeys.all),
  });
}
