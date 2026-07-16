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

    // После create — автопереход на /session/:id (заменил старый redirect на /lobby).
    const [postResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/session') && r.request().method() === 'POST' && r.status() === 201),
      page.getByRole('button', { name: /Огласить партию/i }).click(),
    ]);
    const created = (await postResponse.json()) as { id: string };

    await expect(page).toHaveURL(new RegExp(`/session/${created.id}`));
    await expect(page.getByRole('heading', { name: new RegExp(sessionName) })).toBeVisible();
    await expect(page.getByText(/У стола · роль ведущий/i)).toBeVisible();
    // Ведущий в списке за столом
    await expect(page.locator('span.font-display', { hasText: nickname })).toBeVisible();
  });
});
