import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

const BACKEND_BASE = 'http://localhost:8080/api/v1';
const BACKEND_HEALTH_URL = `${BACKEND_BASE}/actuator/health`;

/**
 * Проверить, что backend поднят. Использовать в `test.beforeAll` — если backend
 * не отвечает, тесты фейлятся с понятным сообщением, а не молча ждут таймаут.
 */
export async function ensureBackendUp(): Promise<void> {
  try {
    const res = await fetch(BACKEND_HEALTH_URL);
    if (!res.ok) {
      throw new Error(`backend health returned ${res.status}`);
    }
  } catch (e) {
    throw new Error(
      `Backend не отвечает на ${BACKEND_HEALTH_URL}. ` +
        `Подними Kotlin/Spring backend (см. docs/05-api.md → §2) перед e2e. Underlying: ${String(e)}`,
    );
  }
}

/**
 * Уникальный никнейм на прогон — timestamp + случайный хвост, вписывается в 3..42.
 * Backend не даёт удалять пользователей, так что реюз тестового ника — путь к конфликтам.
 */
export function uniqueNickname(prefix = 'e2e'): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${ts}-${rnd}`;
}

/** Полностью зачистить сохранённые токены между тестами. */
export async function clearAuth(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('ug:accessToken');
    localStorage.removeItem('ug:refreshToken');
  });
}

/* ────────────────────  API-хелперы для multi-user gameplay-тестов  ─────────
 * Регистрация/join через backend — быстрее и надёжнее, чем UI-flow каждому.
 * Возвращают минимум, необходимый для дальнейших действий в браузере.
 */

async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token !== undefined) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BACKEND_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`POST ${path} → ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export async function apiRegister(
  nickname: string,
  role: 'ADMIN' | 'PLAYER',
): Promise<{ accessToken: string }> {
  return apiPost<{ accessToken: string }>('/auth/quick-register', { nickname, role });
}

export async function apiCreateSession(
  token: string,
  displayName: string,
  players: number,
  rounds = 1,
  roundSum = 100,
): Promise<{ id: string }> {
  return apiPost<{ id: string }>(
    '/session',
    {
      displayName,
      config: {
        sessionType: 'FREE_FOR_ALL',
        numRounds: rounds,
        numTeams: 0,
        numPlayers: players,
        roundSum,
        timeoutMoveSec: 60,
      },
    },
    token,
  );
}

export async function apiJoin(token: string, sessionId: string): Promise<void> {
  await apiPost(`/session/${encodeURIComponent(sessionId)}/join`, {}, token);
}

/**
 * Открыть изолированный context с preload'нутым access-токеном в localStorage.
 * `addInitScript` выполняется до всех сайтовых скриптов при каждом navigate.
 */
export async function openContextWithToken(
  browser: Browser,
  token: string,
): Promise<BrowserContext> {
  const ctx = await browser.newContext();
  await ctx.addInitScript((t) => {
    localStorage.setItem('ug:accessToken', t as string);
  }, token);
  return ctx;
}

/** Сокращённый sanity-check: страница загружена, нет console-ошибок и заголовок совпадает. */
export async function expectTitleCard(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: /^Ultimatum$/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Присесть за стол/i })).toBeVisible();
}
