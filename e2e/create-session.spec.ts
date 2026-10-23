import { expect, test } from '@playwright/test';
import { apiRegister, ensureBackendUp, openContextWithToken, uniqueNickname } from './utils';

test.beforeAll(ensureBackendUp);

test('player can create their own game', async ({ browser }) => {
  const player = await apiRegister(uniqueNickname('player'), 'PLAYER');
  const context = await openContextWithToken(browser, player.accessToken);
  try {
    const page = await context.newPage();
    await page.goto('/lobby');
    await expect(page.getByRole('heading', { name: 'Игры', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Создать игру', exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('host creates a game with defaults and gets an invitation', async ({ browser }) => {
  const host = await apiRegister(uniqueNickname('create'), 'ADMIN');
  const context = await openContextWithToken(browser, host.accessToken);
  try {
    const page = await context.newPage();
    await page.goto('/lobby/new');
    await expect(page.getByLabel('Игроков', { exact: true })).toHaveValue('4');
    await expect(page.getByRole('radio', { name: /Команды/ })).toBeHidden();
    await page.getByLabel('Название игры').fill('Наша игра');
    await page.getByRole('button', { name: 'Создать игру', exact: true }).click();
    await expect(page).toHaveURL(/\/session\/[a-f0-9-]+$/);
    await expect(page.getByLabel('Пригласите друзей')).toHaveValue(/\/session\/[a-f0-9-]+$/);
    await expect(page.getByRole('button', { name: 'Начать игру', exact: true })).toBeDisabled();
    await page.getByRole('link', { name: '← Все игры' }).click();
    await page.reload();
    await expect(page.getByRole('link', { name: 'Вернуться в игру' }).first()).toBeVisible();
  } finally {
    await context.close();
  }
});
