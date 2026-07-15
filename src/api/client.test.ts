import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from './client';
import { authStorage } from './auth-storage';

/*
 * Тесты apiFetch — с mocked fetch. Проверяем:
 *   1. Happy-path: Authorization подставлен, JSON распаршен.
 *   2. 401 → refresh success → retry исходного запроса.
 *   3. 401 → refresh fails → clear + ApiError.
 *   4. Race-safe: два параллельных 401'а делят один refresh-запрос.
 *   5. Ошибка backend'а (400) → ApiError с телом ApiErrorResponse.
 */

const API_BASE = 'http://localhost:8080/api/v1';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiFetch', () => {
  beforeEach(() => {
    authStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches Bearer token and parses JSON on happy path', async () => {
    authStorage.setTokens('access-1', 'refresh-1');
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { id: 'u-1', nickname: 'alice' }));

    const user = await apiFetch<{ id: string; nickname: string }>('/user');

    expect(user).toEqual({ id: 'u-1', nickname: 'alice' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_BASE}/user`);
    expect((init?.headers as Headers).get('Authorization')).toBe('Bearer access-1');
  });

  it('serializes plain-object body to JSON with Content-Type', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { accessToken: 'a', refreshToken: 'r', expiresIn: 900 }),
    );

    await apiFetch('/auth/quick-register', {
      method: 'POST',
      body: { nickname: 'bob', role: 'PLAYER' },
    });

    const init = fetchMock.mock.calls[0]![1]!;
    expect(init.body).toBe(JSON.stringify({ nickname: 'bob', role: 'PLAYER' }));
    expect((init.headers as Headers).get('Content-Type')).toBe('application/json');
  });

  it('refreshes access token on 401 and retries', async () => {
    authStorage.setTokens('old-access', 'refresh-1');
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { status: 401, message: 'expired' }))
      .mockResolvedValueOnce(
        jsonResponse(200, { accessToken: 'new-access', refreshToken: null, expiresIn: 900 }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const result = await apiFetch<{ ok: boolean }>('/user');
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(authStorage.getAccess()).toBe('new-access');
    expect(authStorage.getRefresh()).toBe('refresh-1');
    const retryHeaders = fetchMock.mock.calls[2]![1]!.headers as Headers;
    expect(retryHeaders.get('Authorization')).toBe('Bearer new-access');
  });

  it('clears storage and throws when refresh itself fails', async () => {
    authStorage.setTokens('old-access', 'refresh-1');
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { status: 401, message: 'expired' }))
      .mockResolvedValueOnce(jsonResponse(401, { status: 401, message: 'bad refresh' }));

    await expect(apiFetch('/user')).rejects.toBeInstanceOf(ApiError);
    expect(authStorage.getAccess()).toBeNull();
    expect(authStorage.getRefresh()).toBeNull();
  });

  it('shares one refresh across concurrent 401s (race-safe)', async () => {
    authStorage.setTokens('old-access', 'refresh-1');
    const fetchMock = vi.mocked(fetch);

    // 4 запроса: request A → 401, request B → 401, refresh (один!), retry A → 200, retry B → 200.
    // Порядок вызовов fetch: A-fail, B-fail, refresh, A-retry, B-retry.
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { status: 401, message: 'expired' }))
      .mockResolvedValueOnce(jsonResponse(401, { status: 401, message: 'expired' }))
      .mockResolvedValueOnce(
        jsonResponse(200, { accessToken: 'new-access', refreshToken: null, expiresIn: 900 }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { id: 'u-A' }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 'u-B' }));

    const [resA, resB] = await Promise.all([
      apiFetch<{ id: string }>('/session/A'),
      apiFetch<{ id: string }>('/session/B'),
    ]);

    expect(resA).toEqual({ id: 'u-A' });
    expect(resB).toEqual({ id: 'u-B' });
    // 2 первых + 1 refresh + 2 retry = 5 (refresh — один, не два).
    expect(fetchMock).toHaveBeenCalledTimes(5);
    const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
      typeof url === 'string' && url.endsWith('/auth/refresh'),
    );
    expect(refreshCalls).toHaveLength(1);
  });

  it('wraps 4xx response into ApiError with parsed body', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        timestamp: '2026-07-15T00:00:00.000+00:00',
        status: 400,
        error: 'Bad Request',
        message: 'nickname: must not be blank',
        path: '/api/v1/auth/quick-register',
      }),
    );

    await expect(
      apiFetch('/auth/quick-register', { method: 'POST', body: { nickname: '', role: 'PLAYER' } }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'nickname: must not be blank',
    });
  });
});
