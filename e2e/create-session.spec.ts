import { expect, test } from '@playwright/test';
import { clearAuth, ensureBackendUp, uniqueNickname } from './utils';

test.describe('create session', () => {
  test.beforeAll(async () => {
    await ensureBackendUp();
  });

  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test('PLAYER не видит CTA "Учредить партию" в лобби', async ({ page }) => {
    const nickname = uniqueNickname('cs-p');
    await page.goto('/register');
    await page.getByLabel(/Имя/i).fill(nickname);
    // PLAYER — дефолт
    await page.getByRole('button', { name: /Присесть за стол/i }).click();
    await page.getByRole('link', { name: /Открыть лобби/i }).click();
    await expect(page.getByRole('heading', { name: /Открытые партии/i })).toBeVisible();
    // CTA видима только для ADMIN
    await expect(page.getByRole('link', { name: /Учредить партию/i })).toBeHidden();
  });

  test('ADMIN happy path: register → lobby → create → lobby с новой партией', async ({ page }) => {
    const nickname = uniqueNickname('cs-a');
    const sessionName = `Партия ${nickname}`;

    await page.goto('/register');
    await page.getByLabel(/Имя/i).fill(nickname);
    await page.getByRole('radio', { name: /Ведущий/i }).check({ force: true });
    await page.getByRole('button', { name: /Присесть за стол/i }).click();
    await expect(page).toHaveURL('/');

    // ADMIN видит CTA лобби и учреждения
    await page.getByRole('link', { name: /Открыть лобби/i }).click();
    await expect(page).toHaveURL('/lobby');
    await page.getByRole('link', { name: /Учредить партию/i }).click();
    await expect(page).toHaveURL('/lobby/new');

    // Форма учреждения
    await page.getByLabel(/Название партии/i).fill(sessionName);
    // sessionType остаётся FREE_FOR_ALL по дефолту, numTeams stepper скрыт
    await expect(page.getByText(/^Команд$/i)).toBeHidden();

    await page.getByRole('button', { name: /Огласить партию/i }).click();

    // Редирект в лобби, новая партия видна как карточка
    await expect(page).toHaveURL('/lobby');
    await expect(page.getByText(sessionName)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(new RegExp(`ведущий · ${nickname}`, 'i'))).toBeVisible();
  });
});
