import { expect, test } from '@playwright/test';
import {
  apiRegister,
  clearAuth,
  ensureBackendUp,
  openContextWithToken,
  uniqueNickname,
} from './utils';

test.describe('npc', () => {
  test.beforeAll(async () => {
    await ensureBackendUp();
  });

  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test('ADMIN: cabinet — выковать бота, увидеть в отряде, разжаловать', async ({
    browser,
  }) => {
    const admin = await apiRegister(uniqueNickname('npc-adm'), 'ADMIN');
    const ctx = await openContextWithToken(browser, admin.accessToken);
    const page = await ctx.newPage();

    await page.goto('/npc');
    await expect(page.getByRole('heading', { name: /Отряд ботов/i })).toBeVisible();

    const npcName = uniqueNickname('bot');
    await page.getByLabel(/Имя бота/i).fill(npcName);
    // FAIR — дефолт, форму не трогаем
    await page.getByRole('button', { name: /^Выковать$/i }).click();

    const card = page.getByTestId(`npc-card-${npcName}`);
    await expect(card).toBeVisible({ timeout: 10_000 });

    // Разжаловать — карточка исчезает
    await card.getByRole('button', { name: /разжаловать/i }).click();
    await expect(card).toBeHidden({ timeout: 10_000 });

    await ctx.close();
  });

  test('ADMIN: all-NPC сессия с autoAdvance — bulk-attach → start → FINISHED без ручных ходов', async ({
    browser,
  }) => {
    const admin = await apiRegister(uniqueNickname('npc-sim'), 'ADMIN');
    const ctx = await openContextWithToken(browser, admin.accessToken);
    const page = await ctx.newPage();

    // 1. Создать сессию через UI с autoAdvanceRounds
    const sessionName = `Sim ${uniqueNickname('s')}`;
    await page.goto('/lobby/new');
    await page.getByLabel(/Название партии/i).fill(sessionName);
    // Проверяем чекбокс autoAdvance
    await page.getByRole('checkbox', { name: /Автопрогон раундов/i }).check();

    const [postResponse] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/session') &&
          r.request().method() === 'POST' &&
          r.status() === 201,
      ),
      page.getByRole('button', { name: /Огласить партию/i }).click(),
    ]);
    const created = (await postResponse.json()) as { id: string };

    // 2. Открыть саму сессию
    await page.goto(`/session/${created.id}`);
    await expect(page.getByRole('heading', { name: new RegExp(sessionName) })).toBeVisible();
    await expect(page.getByText(/Автопрогон раундов включён/i)).toBeVisible();

    // 3. Bulk-заполнить 4 FAIR-ботами через панель «Позвать бота»
    await page.getByRole('button', { name: /наковать разом/i }).click();
    await page.getByLabel(/Сколько/i).fill('4');
    // strategy=FAIR — дефолт
    await page.getByRole('button', { name: /Наковать 4/i }).click();

    // Ждём пока бэк проведёт bulk-attach и details обновятся: должно быть 4/4 мест
    await expect(page.getByText(/4\/4/)).toBeVisible({ timeout: 15_000 });

    // 4. Запуск партии
    const startBtn = page.getByRole('button', { name: /Начать партию/i });
    await expect(startBtn).toBeEnabled({ timeout: 15_000 });
    await startBtn.click();

    // 5. autoAdvance протаскивает раунды 1→2→3 без единого клика.
    // Проверяем что дошли до последнего раунда (значит межраундные start-next
    // сработали сами), а таблица очков — уже видна.
    await expect(page.getByRole('heading', { name: /Раунд 3 \/ 3/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Табло очков/i)).toBeVisible();

    // 6. Последний раунд autoAdvance не закрывает — admin явно завершает партию.
    await page.getByRole('button', { name: /Завершить партию/i }).click();
    await expect(page.getByText(/Партия окончена/i)).toBeVisible({ timeout: 15_000 });

    await ctx.close();
  });
});
