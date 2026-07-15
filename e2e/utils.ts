import { expect, type Page } from '@playwright/test';

const BACKEND_HEALTH_URL = 'http://localhost:8080/api/v1/actuator/health';

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

/** Сокращённый sanity-check: страница загружена, нет console-ошибок и заголовок совпадает. */
export async function expectTitleCard(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: /^Ultimatum$/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Присесть за стол/i })).toBeVisible();
}
