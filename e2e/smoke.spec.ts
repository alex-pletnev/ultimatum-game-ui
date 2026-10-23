import { expect, test } from '@playwright/test';
import { expectTitleCard } from './utils';

test('home explains the game and links to real rules', async ({ page }) => {
  await page.goto('/');
  await expectTitleCard(page);
  await page.getByRole('link', { name: 'Как устроена игра →' }).click();
  await expect(
    page.getByRole('heading', { name: 'Предлагайте. Решайте. Зарабатывайте.' }),
  ).toBeVisible();
});

test('unknown routes have a way home; style guide remains directly accessible', async ({
  page,
}) => {
  await page.goto('/unknown');
  await page.getByRole('link', { name: 'На главную', exact: true }).click();
  await expectTitleCard(page);
  await page.goto('/_style-guide');
  await expect(page.getByRole('heading', { name: /^Style Guide$/i })).toBeVisible();
});
