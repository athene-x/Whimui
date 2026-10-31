import {
  toListSearchParams,
  type ListQueryParams,
  type OffsetPagedResult,
} from '@whimui/core/list-query';

import { api } from '@/lib/api';

import type { Task, TaskInput } from './schemas';

export function listTasks(params: ListQueryParams<'title'>, signal: AbortSignal) {
  return api
    .get('tasks', { searchParams: toListSearchParams(params), signal })
    .json<OffsetPagedResult<Task>>();
}

export function createTask(input: TaskInput) {
  return api.post('tasks', { json: input }).json<Task>();
}

export function updateTask(id: string, input: TaskInput) {
  return api.put(`tasks/${encodeURIComponent(id)}`, { json: input }).json<Task>();
}

export async function deleteTask(id: string) {
  await api.delete(`tasks/${encodeURIComponent(id)}`);
}
