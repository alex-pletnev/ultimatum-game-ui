import { expect, test } from '@playwright/test';
import {
  apiCreateSession,
  apiJoin,
  apiRegister,
  ensureBackendUp,
  openContextWithToken,
  uniqueNickname,
} from './utils';

/*
 * Первый end-to-end регрессионник полного цикла: admin + 2 player.
 *   admin: создаёт партию, стартует, ждёт конца, закрывает.
 *   p1, p2: делают offer, дожидаются shuffle, делают decision (accept).
 * После всех decisions — у admin появляется табло очков.
 */
test.describe('full gameplay', () => {
  test.beforeAll(async () => {
    await ensureBackendUp();
  });

  test('admin + 2 players — полный раунд до табло очков', async ({ browser }) => {
    // ────────── setup через API (быстрее, чем через UI для каждого) ──────────
    const adminNick = uniqueNickname('fg-adm');
    const p1Nick = uniqueNickname('fg-p1');
    const p2Nick = uniqueNickname('fg-p2');

    const admin = await apiRegister(adminNick, 'ADMIN');
    const p1 = await apiRegister(p1Nick, 'PLAYER');
    const p2 = await apiRegister(p2Nick, 'PLAYER');

    const session = await apiCreateSession(admin.accessToken, `Полный ${adminNick}`, 2, 1);
    await apiJoin(p1.accessToken, session.id);
    await apiJoin(p2.accessToken, session.id);

    // ────────── три изолированных браузерных контекста ──────────
    const adminCtx = await openContextWithToken(browser, admin.accessToken);
    const p1Ctx = await openContextWithToken(browser, p1.accessToken);
    const p2Ctx = await openContextWithToken(browser, p2.accessToken);
    const adminPage = await adminCtx.newPage();
    const p1Page = await p1Ctx.newPage();
    const p2Page = await p2Ctx.newPage();

    const url = `/session/${session.id}`;
    await Promise.all([adminPage.goto(url), p1Page.goto(url), p2Page.goto(url)]);

    // ────────── admin стартует ──────────
    const startBtn = adminPage.getByRole('button', { name: /Начать партию/i });
    await expect(startBtn).toBeEnabled({ timeout: 15_000 });
    await startBtn.click();
    await expect(adminPage.getByText(/^Партия идёт$/i)).toBeVisible({ timeout: 10_000 });
    await expect(p1Page.getByText(/^Партия идёт$/i)).toBeVisible({ timeout: 10_000 });
    await expect(p2Page.getByText(/^Партия идёт$/i)).toBeVisible({ timeout: 10_000 });

    // ────────── обе стороны оффертят ──────────
    // Не ждём waiting-текст между двумя submit'ами: как только придёт второй
    // offer, backend делает shuffle и сразу переводит фазу в OFFERS_SENT —
    // waiting-момент может проскочить незамеченным.
    async function offer(page: import('@playwright/test').Page, amount: string) {
      const submit = page.getByRole('button', { name: /Огласить сделку/i });
      await expect(submit).toBeEnabled({ timeout: 15_000 });
      const slider = page.getByLabel(/Сумма предложения/i);
      await slider.fill(amount);
      await submit.click();
    }
    await offer(p1Page, '40');
    await offer(p2Page, '60');

    // ────────── shuffle → OFFERS_SENT — обе стороны accept ──────────
    // Аналогично offer: не ждём waiting-текст, чтобы не проскочить фазу
    // (после второго accept backend сразу закрывает раунд и уходит из OFFERS_SENT).
    async function accept(page: import('@playwright/test').Page) {
      const acceptBtn = page.getByRole('button', { name: /Согласиться/i });
      await expect(acceptBtn).toBeEnabled({ timeout: 15_000 });
      await acceptBtn.click();
    }
    await accept(p1Page);
    await accept(p2Page);

    // ────────── admin видит табло очков ──────────
    await expect(adminPage.getByText(/Табло очков/i)).toBeVisible({ timeout: 15_000 });
    // При обоих accept'ах у каждого игрока score > 0 (получил либо offerValue,
    // либо roundSum-offerValue). Числа зависят от shuffle-порядка backend'a —
    // проверяем факт присутствия ников на табло.
    await expect(adminPage.locator('li', { hasText: p1Nick })).toBeVisible();
    await expect(adminPage.locator('li', { hasText: p2Nick })).toBeVisible();

    // ────────── cleanup ──────────
    await Promise.all([adminCtx.close(), p1Ctx.close(), p2Ctx.close()]);
  });
});
