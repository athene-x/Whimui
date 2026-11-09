import type { ListQueryParams } from '@athene-x/whimui/list-query';

import { toListSearchParams } from '@athene-x/whimui/list-query';

import { api, labApi } from '@/lib/api';

import type { ListEcho, Me, Ping } from './types';

export function ping(): Promise<Ping> {
  return labApi.get('ping').json();
}

export function getErrorStatus(status: number): Promise<unknown> {
  return labApi.get(`errors/${status}`).json();
}

export function getPlainStatus(status: number): Promise<unknown> {
  return labApi.get(`plain/${status}`).json();
}

export function getTextStatus(status: number): Promise<unknown> {
  return labApi.get(`text/${status}`).json();
}

export function getSlow(ms: number, timeout: number): Promise<unknown> {
  return labApi.extend({ timeout }).get('slow', { searchParams: { ms } }).json();
}

/** A port nothing listens on: the browser fails to connect, which ky reports as a network error. */
export function getUnreachable(): Promise<unknown> {
  return labApi
    .extend({ prefix: 'http://127.0.0.1:9/mock/api/v1', timeout: 3000 })
    .get('ping')
    .json();
}

export function getFailing(status: number, key: string): Promise<unknown> {
  return labApi.get(`fail/${status}`, { searchParams: { key } }).json();
}

export function echoListParams(params: ListQueryParams): Promise<ListEcho> {
  return labApi.get('list-echo', { searchParams: toListSearchParams(params) }).json();
}

export function validate(title: string): Promise<unknown> {
  return labApi.post('validate', { json: { title } }).json();
}

/** Through the BFF: the server attaches the session's bearer token, or answers 401 itself. */
export function getMe(): Promise<Me> {
  return api.get('me').json();
}
