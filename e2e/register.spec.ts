import { expect, test } from '@playwright/test';
import { clearAuth, ensureBackendUp, expectTitleCard, uniqueNickname } from './utils';

test.beforeAll(ensureBackendUp);
test.beforeEach(async ({ page }) => clearAuth(page));

test('enter a name, go directly to games, confirm logout', async ({ page }) => {
  const nickname = uniqueNickname('entry');
  await page.getByRole('link', { name: 'Играть с друзьями' }).click();
  await page.getByLabel('Имя', { exact: true }).fill(nickname);
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page).toHaveURL('/lobby');
  await expect(page.getByRole('heading', { name: 'Игры', exact: true })).toBeVisible();
  expect(await page.evaluate(() => !!localStorage.getItem('ug:accessToken'))).toBe(true);
  await page.getByRole('button', { name: 'Выйти', exact: true }).click();
  await page.getByRole('button', { name: 'Остаться', exact: true }).click();
  await expect(page).toHaveURL('/lobby');
  await page.getByRole('button', { name: 'Выйти', exact: true }).click();
  await page.getByRole('button', { name: 'Выйти из профиля' }).click();
  await expectTitleCard(page);
  expect(await page.evaluate(() => localStorage.getItem('ug:accessToken'))).toBeNull();
});

test('short nickname is rejected locally', async ({ page }) => {
  let calls = 0;
  page.on('request', (r) => {
    if (r.url().includes('/auth/quick-register')) calls++;
  });
  await page.goto('/register');
  await page.getByLabel('Имя', { exact: true }).fill('ab');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('от 3 до 42');
  await expect(page.getByLabel('Имя', { exact: true })).toBeFocused();
  expect(calls).toBe(0);
});

test('create game intent registers a host and opens setup directly', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Имя', { exact: true }).fill(uniqueNickname('host'));
  await page.getByRole('radio', { name: /Создать игру/ }).check();
  const request = page.waitForRequest((r) => r.url().includes('/auth/quick-register'));
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  expect((await request).postDataJSON().role).toBe('PLAYER');
  await expect(page).toHaveURL('/lobby/new');
});
