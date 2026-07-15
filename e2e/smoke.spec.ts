import { expect, test } from '@playwright/test';
import { clearAuth, expectTitleCard } from './utils';

test.describe('smoke', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test('title card renders on /', async ({ page }) => {
    await page.goto('/');
    await expectTitleCard(page);
    await expect(page.getByText(/A game of offers, refusals & reckoning/i)).toBeVisible();
  });

  test('style guide loads all 4 sections', async ({ page }) => {
    await page.goto('/_style-guide');
    await expect(page.getByRole('heading', { name: /^Style Guide$/i })).toBeVisible();
    await expect(page.getByText(/I · Палитра/i)).toBeVisible();
    await expect(page.getByText(/II · Типографика/i)).toBeVisible();
    await expect(page.getByText(/III · Тени/i)).toBeVisible();
    await expect(page.getByText(/IV · Примитивы/i)).toBeVisible();
  });
});
