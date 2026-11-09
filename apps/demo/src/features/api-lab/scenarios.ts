import { ApiError, apiErrorBody } from '@athene-x/whimui/api';
import { describeError, toSubmitError } from '@athene-x/whimui/form';
import { createQueryClient } from '@athene-x/whimui/query';

import {
  echoListParams,
  getErrorStatus,
  getFailing,
  getMe,
  getPlainStatus,
  getSlow,
  getTextStatus,
  getUnreachable,
  ping,
  validate,
} from './api';

export type LabContext = { loggedIn: boolean; audience: string };

export type Outcome = { ok: boolean; detail: string };

export type Scenario = {
  id: string;
  title: string;
  /** What in the kit this exercises. */
  covers: string;
  /** Scenarios with a side effect on the page state are run one at a time, never in "run all". */
  sideEffect?: string;
  run: (context: LabContext) => Promise<Outcome>;
};

class Check {
  readonly lines: string[] = [];
  ok = true;

  equal<T>(label: string, actual: T, expected: T) {
    const pass = Object.is(actual, expected) || JSON.stringify(actual) === JSON.stringify(expected);
    this.record(pass, label, `${show(actual)}${pass ? '' : ` (expected ${show(expected)})`}`);
  }

  truthy(label: string, value: unknown, shown = show(value)) {
    this.record(Boolean(value), label, shown);
  }

  note(label: string, value: unknown) {
    this.lines.push(`  ${label}: ${show(value)}`);
  }

  record(pass: boolean, label: string, value: string) {
    if (!pass) this.ok = false;
    this.lines.push(`${pass ? 'ok ' : 'NOT'} ${label}: ${value}`);
  }

  outcome(): Outcome {
    return { ok: this.ok, detail: this.lines.join('\n') };
  }
}

function show(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (typeof value === 'string') return value;
  return JSON.stringify(value) ?? String(value);
}

/** Runs `action`, expecting it to throw an `ApiError`; returns `null` (and fails) otherwise. */
async function expectApiError(
  check: Check,
  action: () => Promise<unknown>,
): Promise<ApiError | null> {
  try {
    const result = await action();
    check.record(false, 'throws ApiError', `resolved with ${show(result)}`);
    return null;
  } catch (error) {
    if (error instanceof ApiError) {
      check.record(true, 'throws ApiError', `${error.status} ${error.code}`);
      return error;
    }
    check.record(false, 'throws ApiError', `threw ${show(error)}`);
    return null;
  }
}

export const scenarios: Scenario[] = [
  {
    id: 'ok',
    title: '200 JSON resolves',
    covers: 'createApiClient, prefix, .json()',
    async run() {
      const check = new Check();
      const result = await ping();
      check.equal('ok', result.ok, true);
      check.truthy('at is an ISO timestamp', !Number.isNaN(Date.parse(result.at)), result.at);
      return check.outcome();
    },
  },
  {
    id: 'envelope',
    title: 'Error envelope becomes ApiError',
    covers: 'toApiError, ApiError.status/code/message/errors',
    async run() {
      const check = new Check();
      const error = await expectApiError(check, () => getErrorStatus(409));
      if (!error) return check.outcome();
      check.equal('status', error.status, 409);
      check.equal('code', error.code, 'Demo.Conflict');
      check.equal('message is the description', error.message, 'This title already exists.');
      check.equal('errors', error.errors, []);
      check.truthy('cause is the ky HTTPError', error.cause instanceof Error, String(error.cause));
      return check.outcome();
    },
  },
  {
    id: 'fields',
    title: 'Field errors survive and map to a field',
    covers: 'ApiError.errors, toSubmitError, describeError',
    async run() {
      const check = new Check();
      const error = await expectApiError(check, () => validate('   '));
      if (!error) return check.outcome();
      check.equal('status', error.status, 400);
      check.equal('errors[0].field', error.errors[0]?.field, 'title');
      const submit = toSubmitError<'title'>(error, 'Unexpected', {
        'Demo.TitleRequired': { field: 'title', message: 'Please enter a title' },
      });
      check.equal('toSubmitError → fields.title', submit.fields?.title, 'Please enter a title');
      check.equal(
        'describeError prefers the mapped detail code',
        describeError(error, { 'Demo.TitleRequired': 'Mapped' }),
        'Mapped',
      );
      check.equal(
        'describeError falls back to the description',
        describeError(error),
        'The input is invalid.',
      );
      return check.outcome();
    },
  },
  {
    id: 'unexpected-json',
    title: 'Non-envelope JSON body → Web.UnexpectedResponse',
    covers: 'isApiErrorBody, ApiError.data',
    async run() {
      const check = new Check();
      const error = await expectApiError(check, () => getPlainStatus(500));
      if (!error) return check.outcome();
      check.equal('status', error.status, 500);
      check.equal('code', error.code, 'Web.UnexpectedResponse');
      check.equal('data keeps the body', error.data, { oops: true });
      return check.outcome();
    },
  },
  {
    id: 'unexpected-text',
    title: 'Text body → Web.UnexpectedResponse',
    covers: 'toApiError with a non-JSON body',
    async run() {
      const check = new Check();
      const error = await expectApiError(check, () => getTextStatus(502));
      if (!error) return check.outcome();
      check.equal('status', error.status, 502);
      check.equal('code', error.code, 'Web.UnexpectedResponse');
      check.equal('data is the text', error.data, 'boom');
      return check.outcome();
    },
  },
  {
    id: 'timeout',
    title: 'Timeout → Web.Timeout with status 0',
    covers: 'toApiError (isTimeoutError)',
    async run() {
      const check = new Check();
      const started = Date.now();
      const error = await expectApiError(check, () => getSlow(1500, 300));
      if (!error) return check.outcome();
      check.equal('status', error.status, 0);
      check.equal('code', error.code, 'Web.Timeout');
      check.truthy(
        'gave up before the API answered',
        Date.now() - started < 1400,
        `${Date.now() - started} ms`,
      );
      return check.outcome();
    },
  },
  {
    id: 'network',
    title: 'Connection refused → Web.NetworkError',
    covers: 'toApiError (isNetworkError)',
    async run() {
      const check = new Check();
      const error = await expectApiError(check, getUnreachable);
      if (!error) return check.outcome();
      check.equal('status', error.status, 0);
      check.equal('code', error.code, 'Web.NetworkError');
      return check.outcome();
    },
  },
  {
    id: 'retry',
    title: 'Queries retry 5xx twice and 4xx never',
    covers: 'createQueryClient, shouldRetry',
    async run() {
      const check = new Check();
      const client = createQueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
      const attemptsFor = async (status: number) => {
        const key = crypto.randomUUID();
        try {
          await client.fetchQuery({
            queryKey: ['lab', 'fail', key],
            queryFn: () => getFailing(status, key),
          });
          return -1;
        } catch (error) {
          return error instanceof ApiError
            ? (error.data as { attempt?: number }).attempt
            : undefined;
        }
      };
      check.equal('attempts for 503', await attemptsFor(503), 3);
      check.equal('attempts for 404', await attemptsFor(404), 1);
      return check.outcome();
    },
  },
  {
    id: 'list-params',
    title: 'toListSearchParams matches the ListQueryRequest contract',
    covers: 'list-query: toListSearchParams',
    async run() {
      const check = new Check();
      const echo = await echoListParams({
        searchTerm: '  hello ',
        sort: [{ field: 'title', descending: true }, { field: 'createdAt' }],
        filters: [
          { field: 'status', operator: 'in', value: ['active', 'paused'] },
          { field: 'name', operator: 'cn', value: 'x' },
          { field: 'empty', operator: 'eq', value: '' },
        ],
        page: 2,
        size: 10,
      });
      check.equal('searchTerm trimmed', echo.searchTerm, 'hello');
      check.equal('sort', echo.sort, '-title,createdAt');
      check.equal('filters (empty value dropped)', echo.filters, [
        'status:in:active,paused',
        'name:cn:x',
      ]);
      check.equal('page', echo.page, '2');
      check.equal('size', echo.size, '10');
      return check.outcome();
    },
  },
  {
    id: 'pure',
    title: 'ApiError helpers without a network',
    covers: 'apiErrorBody, describeError fallback',
    async run() {
      const check = new Check();
      const error = new ApiError(409, apiErrorBody('Demo.Conflict', 'Taken.'));
      check.equal(
        'describeError maps the code',
        describeError(error, { 'Demo.Conflict': 'Already taken' }),
        'Already taken',
      );
      check.equal('describeError uses the description', describeError(error), 'Taken.');
      check.equal(
        'describeError falls back for other errors',
        describeError(new TypeError('x'), {}, 'Fallback'),
        'Fallback',
      );
      check.equal(
        'toSubmitError for a non-ApiError',
        toSubmitError(new TypeError('x'), 'Unexpected'),
        { message: 'Unexpected' },
      );
      return check.outcome();
    },
  },
  {
    id: 'bff',
    title: 'BFF: 401 Web.SessionRequired when logged out, bearer forwarded when logged in',
    covers: 'route /api/v1/[...path], authorizeWith, onUnauthorized → markSessionExpired',
    sideEffect: 'When logged out this triggers the session-expired banner (reload to clear it).',
    async run({ loggedIn, audience }) {
      const check = new Check();
      if (loggedIn) {
        const me = await getMe();
        check.truthy('sub', me.sub);
        check.truthy(`aud includes ${audience}`, me.aud.includes(audience), JSON.stringify(me.aud));
        check.note('preferred_username', me.preferredUsername);
        check.note('iss', me.iss);
        return check.outcome();
      }
      const error = await expectApiError(check, getMe);
      if (!error) return check.outcome();
      check.equal('status', error.status, 401);
      check.equal('code', error.code, 'Web.SessionRequired');
      check.note('and markSessionExpired() ran: see the banner at the top', true);
      return check.outcome();
    },
  },
];
