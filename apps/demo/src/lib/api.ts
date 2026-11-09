import { createApiClient } from '@athene-x/whimui/api';

/** The app's client: same-origin `/api/v1`, where the BFF attaches the session's token. */
export const api = createApiClient();

/** Straight at the demo's fake API, no login needed: exercises the client's error handling. */
export const labApi = createApiClient({ prefix: '/mock/api/v1' });
