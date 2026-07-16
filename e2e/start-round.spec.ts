import { expect, test } from '@playwright/test';
import { clearAuth, ensureBackendUp, uniqueNickname } from './utils';

/*
 * ADMIN учреждает партию с минимумом игроков (2) — обычно недостижимо в одиночку,
 * но SEND /start в бэкенде проходит независимо от заполнения (в MVP fill-check не блокирующий).
 * Проверяем: до старта видна кнопка «Начать партию», после клика — панель «Раунд 1 / N · Ждём предложений».
 */
test.describe('start round', () => {
  test.beforeAll(async () => {
    await ensureBackendUp();
  });

  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test('ADMIN sees "Начать партию", клик → phase-панель', async ({ page }) => {
    const nickname = uniqueNickname('start');
    const sessionName = `Стартовая ${nickname}`;

    await page.goto('/register');
    await page.getByLabel(/Имя/i).fill(nickname);
    await page.getByRole('radio', { name: /Ведущий/i }).check({ force: true });
    await page.getByRole('button', { name: /Присесть за стол/i }).click();
    await expect(page).toHaveURL('/');

    await page.getByRole('link', { name: /Открыть лобби/i }).click();
    await expect(page).toHaveURL('/lobby');
    await page.getByRole('link', { name: /Учредить партию/i }).click();
    await expect(page).toHaveURL('/lobby/new');
    await page.getByLabel(/Название партии/i).fill(sessionName);

    // Ждём POST /session 201 в паре с кликом, забираем id и сразу навигируем на /session/{id}.
    // Не идём через лобби, чтобы не упираться в баг T-014 (после POST карточка иногда не
    // отрендеривается в Playwright из-за race с React StrictMode + Vite HMR).
    const [postResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith('/session') && r.request().method() === 'POST' && r.status() === 201),
      page.getByRole('button', { name: /Огласить партию/i }).click(),
    ]);
    const created = (await postResponse.json()) as { id: string };
    await page.goto(`/session/${created.id}`);
    await expect(page).toHaveURL(new RegExp('/session/[0-9a-f-]+'));

    // До старта: state «Ждём начала», кнопка присутствует.
    await expect(page.getByText(/^Ждём начала$/i)).toBeVisible();
    const startBtn = page.getByRole('button', { name: /Начать партию/i });
    await expect(startBtn).toBeVisible();
    // Дать STOMP подключиться (иначе кнопка disabled) — под нагрузкой e2e handshake до ~10 с.
    await expect(startBtn).toBeEnabled({ timeout: 15_000 });

    await startBtn.click();

    // После старта: state «Партия идёт» приходит через WS-broadcast sessionStatus.
    await expect(page.getByText(/^Партия идёт$/i)).toBeVisible({ timeout: 10_000 });

    // Round-панель приходит через WS-broadcast roundStatus + invalidate currentRound.
    // numRounds — из дефолта формы (сейчас 3); не привязываемся к конкретному значению.
    await expect(page.getByRole('heading', { name: /^Раунд 1 \/ \d+$/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/^Ждём предложений$/i)).toBeVisible();
  });
});
