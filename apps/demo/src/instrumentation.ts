/** Fails the server start, not the first request, when apps/demo/.env is incomplete. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { env } = await import('@/lib/env');
  env();
}
