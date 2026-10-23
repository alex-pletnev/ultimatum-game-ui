import { expect, test } from '@playwright/test';
import { apiRegister, ensureBackendUp, openContextWithToken, uniqueNickname } from './utils';

test.beforeAll(ensureBackendUp);
test('anonymous visitor is offered name entry', async ({ page }) => {
  await page.goto('/lobby');
  await expect(page).toHaveURL('/register');
  await expect(page.getByRole('heading', { name: 'Как вас зовут?' })).toBeVisible();
});
test('games have a refresh action and clear navigation', async ({ browser }) => {
  const player = await apiRegister(uniqueNickname('lobby'), 'PLAYER');
  const context = await openContextWithToken(browser, player.accessToken);
  try {
    const page = await context.newPage();
    await page.goto('/lobby');
    await expect(page.getByRole('button', { name: 'Обновить список' })).toBeEnabled();
    await page.getByRole('button', { name: 'Обновить список' }).click();
    await expect(page.getByRole('heading', { name: 'Игры', exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toBeVisible();
  } finally {
    await context.close();
  }
});
