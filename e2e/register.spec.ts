import { expect, test } from '@playwright/test';
import { clearAuth, ensureBackendUp, expectTitleCard, uniqueNickname } from './utils';

test.describe('registration', () => {
  test.beforeAll(async () => {
    await ensureBackendUp();
  });

  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test('happy path: register → welcome → logout → title card', async ({ page }) => {
    const nickname = uniqueNickname('happy');

    // Титульная → CTA → форма
    await page.goto('/');
    await page.getByRole('link', { name: /Присесть за стол/i }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('heading', { name: /Присесть за стол/i })).toBeVisible();

    // Заполняем и отправляем (PLAYER — дефолт)
    await page.getByLabel(/Имя/i).fill(nickname);
    await page.getByRole('button', { name: /Присесть за стол/i }).click();

    // Возврат на / в welcome-состоянии
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: new RegExp(nickname, 'i') })).toBeVisible();
    await expect(page.getByText(/^играющий$/i)).toBeVisible();

    // Токены попали в localStorage
    const access = await page.evaluate(() => localStorage.getItem('ug:accessToken'));
    expect(access, 'access token должен сохраниться').toMatch(/^eyJ/);

    // Logout возвращает на title card
    await page.getByRole('button', { name: /встать из-за стола/i }).click();
    await expectTitleCard(page);
    const accessAfter = await page.evaluate(() => localStorage.getItem('ug:accessToken'));
    expect(accessAfter).toBeNull();
  });

  test('short nickname → local validation, no network call', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/api/v1/**', (route) => {
      apiCalled = true;
      return route.continue();
    });

    await page.goto('/register');
    await page.getByLabel(/Имя/i).fill('ab');
    await page.getByRole('button', { name: /Присесть за стол/i }).click();

    await expect(page.getByRole('alert')).toContainText(/короче/i);
    // Даже маленький event-loop tick — API не должен быть тронут.
    await page.waitForTimeout(200);
    expect(apiCalled, 'клиентская валидация должна отсечь запрос').toBe(false);
  });

  test('role toggle: Ведущий отправляет role: ADMIN', async ({ page }) => {
    const nickname = uniqueNickname('admin');

    // Перехват POST, чтобы прочитать body
    let requestBody: string | null = null;
    await page.route('**/api/v1/auth/quick-register', async (route) => {
      requestBody = route.request().postData();
      return route.continue();
    });

    await page.goto('/register');
    await page.getByLabel(/Имя/i).fill(nickname);
    // WaxSeal-SVG внутри <label> перехватывает pointer-events на sr-only radio.
    // force: true — обходит actionability check; радиокнопка реально работает
    // (кликом по label), но Playwright пытается кликать по input координатно.
    await page.getByRole('radio', { name: /Ведущий/i }).check({ force: true });
    await page.getByRole('button', { name: /Присесть за стол/i }).click();

    await expect(page).toHaveURL('/');
    expect(requestBody).toContain('"role":"ADMIN"');
  });
});
