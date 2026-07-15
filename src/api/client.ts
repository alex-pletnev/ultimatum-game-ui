/*
 * REST-клиент с JWT-интерсептором и авто-refresh.
 *
 * Контракт:
 *   - JSON in, JSON out; исключение — 204 No Content возвращает undefined.
 *   - Ошибки backend'а разворачиваются в ApiError с телом ApiErrorResponse
 *     (см. docs/05-api.md → «Формат ошибок»).
 *   - 401 → одна попытка refresh → retry исходного запроса. Refresh — race-safe:
 *     параллельные 401'ы делят один in-flight запрос к /auth/refresh.
 *   - 401 без refresh-токена ИЛИ refresh, вернувший ошибку — очищает storage,
 *     каскадные хуки увидят `getAccess() === null` и переведут пользователя на login.
 */

import { config } from './config';
import { authStorage } from './auth-storage';
import type { ApiErrorResponse, JwtAuthenticationResponse } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorResponse | null;

  constructor(status: number, body: ApiErrorResponse | null, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight !== null) return refreshInFlight;

  const refreshToken = authStorage.getRefresh();
  if (refreshToken === null) return null;

  refreshInFlight = (async (): Promise<string | null> => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        authStorage.clear();
        return null;
      }
      const data = (await response.json()) as JwtAuthenticationResponse;
      // Rotation отключена в MVP — сервер возвращает refreshToken: null.
      // Сохраняем старый refresh, чтобы next-refresh снова работал.
      authStorage.setTokens(data.accessToken, data.refreshToken ?? refreshToken);
      return data.accessToken;
    } catch {
      authStorage.clear();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

type ApiFetchInit = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
};

function normalizeBody(
  body: ApiFetchInit['body'],
  headers: Headers,
): BodyInit | null | undefined {
  if (body === undefined || body === null) return body;
  if (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams
  ) {
    return body;
  }
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return JSON.stringify(body);
}

export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const send = async (accessToken: string | null): Promise<Response> => {
    const headers = new Headers(init.headers);
    const body = normalizeBody(init.body, headers);
    if (accessToken !== null) headers.set('Authorization', `Bearer ${accessToken}`);
    return fetch(`${config.apiBaseUrl}${path}`, {
      ...init,
      body: body ?? null,
      headers,
    });
  };

  let response = await send(authStorage.getAccess());

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed !== null) response = await send(refreshed);
  }

  if (!response.ok) {
    let body: ApiErrorResponse | null = null;
    try {
      body = (await response.json()) as ApiErrorResponse;
    } catch {
      // Non-JSON error body — оставляем body: null, message из statusText.
    }
    throw new ApiError(response.status, body, body?.message ?? response.statusText);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
