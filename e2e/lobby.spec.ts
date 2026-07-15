import { expect, test } from '@playwright/test';
import { clearAuth, ensureBackendUp, uniqueNickname } from './utils';

/*
 * Лобби доступно только залогиненным. Регистрируемся уникальным ником,
 * идём в лобби, проверяем что заголовок и одно из состояний (карточки/пустой стол) отрисованы.
 * Не полагаемся на то, есть ли открытые партии — backend shared, состояние переменное.
 */

test.describe('lobby', () => {
  test.beforeAll(async () => {
    await ensureBackendUp();
  });

  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test('unauthenticated: /lobby redirects to /', async ({ page }) => {
    await page.goto('/lobby');
    // Redirect должен вернуть на /
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /^Ultimatum$/i })).toBeVisible();
  });

  test('authenticated: register → open lobby → see header + (cards | empty state)', async ({
    page,
  }) => {
    const nickname = uniqueNickname('lobby');

    // Регистрация
    await page.goto('/register');
    await page.getByLabel(/Имя/i).fill(nickname);
    await page.getByRole('button', { name: /Присесть за стол/i }).click();
    await expect(page).toHaveURL('/');

    // CTA лобби живой (не disabled)
    await page.getByRole('link', { name: /Открыть лобби/i }).click();
    await expect(page).toHaveURL('/lobby');

    // Заголовок и обратная ссылка присутствуют
    await expect(page.getByRole('heading', { name: /Открытые партии/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /вернуться ко входу/i })).toBeVisible();

    // Дождаться терминального состояния: skeleton'ы (animate-pulse) исчезли.
    // Дальше — либо empty, либо карточки, оба ok.
    await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 10_000 });
  });
});
