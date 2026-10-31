import 'server-only';

import type { ApiErrorBody } from '@athenex/web-core/api';

import { taskInputSchema, type Task, type TaskInput } from './schemas';

// Demo storage survives development reloads, but only within this server process.
const state = globalThis as typeof globalThis & { starterTasks?: Map<string, Task> };
const tasks = (state.starterTasks ??= new Map(
  ['Connect the backend', 'Configure authentication', 'Install app UI components'].map(
    (title, i) => {
      const id = String(i + 1);
      return [id, { id, title, completed: false }];
    },
  ),
));

function error(status: number, code: string, description: string) {
  return Response.json({ code, description, errors: null } satisfies ApiErrorBody, { status });
}

async function readInput(request: Request): Promise<TaskInput | Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, 'Tasks.InvalidInput', 'Invalid JSON.');
  }
  const parsed = taskInputSchema.safeParse(body);
  return parsed.success ? parsed.data : error(400, 'Tasks.InvalidInput', 'Invalid task input.');
}

function duplicate(input: TaskInput, id?: string) {
  return [...tasks.values()].some(
    (task) => task.id !== id && task.title.toLowerCase() === input.title.toLowerCase(),
  );
}

export function listTasksResponse(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = Number(params.get('page') ?? 1);
  const size = Number(params.get('size') ?? 20);
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > 100
  ) {
    return error(400, 'Tasks.InvalidPagination', 'Use a positive page and a size from 1 to 100.');
  }
  const sort = params.get('sort') ?? 'title';
  if (sort !== 'title' && sort !== '-title') {
    return error(400, 'Tasks.InvalidSort', 'Only title sorting is supported.');
  }
  if (params.has('filters')) {
    return error(400, 'Tasks.InvalidFilter', 'This example does not support filters.');
  }
  const search = (params.get('searchTerm') ?? '').trim().toLowerCase();
  const matching = [...tasks.values()]
    .filter((task) => task.title.toLowerCase().includes(search))
    .sort((a, b) => (sort.startsWith('-') ? -1 : 1) * a.title.localeCompare(b.title));
  return Response.json({
    items: matching.slice((page - 1) * size, page * size),
    page,
    size,
    totalItems: matching.length,
    totalPages: Math.ceil(matching.length / size),
  });
}

export async function createTaskResponse(request: Request) {
  const input = await readInput(request);
  if (input instanceof Response) return input;
  if (duplicate(input)) return error(409, 'Tasks.DuplicateTitle', 'This title already exists.');
  const task = { ...input, id: crypto.randomUUID() };
  tasks.set(task.id, task);
  return Response.json(task, { status: 201 });
}

type TaskRouteContext = { params: Promise<{ id: string }> };

export async function updateTaskResponse(request: Request, context: TaskRouteContext) {
  const { id } = await context.params;
  if (!tasks.has(id)) return error(404, 'Tasks.NotFound', 'Task not found.');
  const input = await readInput(request);
  if (input instanceof Response) return input;
  // Recheck after awaiting the request body: another request may have deleted it.
  if (!tasks.has(id)) return error(404, 'Tasks.NotFound', 'Task not found.');
  if (duplicate(input, id)) return error(409, 'Tasks.DuplicateTitle', 'This title already exists.');
  const task = { ...input, id };
  tasks.set(id, task);
  return Response.json(task);
}

export async function deleteTaskResponse(_request: Request, context: TaskRouteContext) {
  const { id } = await context.params;
  if (!tasks.delete(id)) return error(404, 'Tasks.NotFound', 'Task not found.');
  return new Response(null, { status: 204 });
}
