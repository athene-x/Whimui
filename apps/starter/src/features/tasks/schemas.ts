import { z } from 'zod';

export const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  completed: z.boolean(),
});

export type TaskInput = z.infer<typeof taskInputSchema>;
export type Task = TaskInput & { id: string };
