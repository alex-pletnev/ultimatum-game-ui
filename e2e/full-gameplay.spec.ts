import { expect, test, type Page } from '@playwright/test';
import {
  apiCreateSession,
  apiJoin,
  apiRegister,
  ensureBackendUp,
  openContextWithToken,
  uniqueNickname,
} from './utils';

test.beforeAll(ensureBackendUp);
test('two players complete two rounds, restore scores after refresh and view results', async ({
  browser,
}) => {
  const host = await apiRegister(uniqueNickname('host'), 'ADMIN');
  const nick1 = uniqueNickname('alice');
  const nick2 = uniqueNickname('bob');
  const p1 = await apiRegister(nick1, 'PLAYER');
  const p2 = await apiRegister(nick2, 'PLAYER');
  const game = await apiCreateSession(host.accessToken, 'Два раунда', 2, 2);
  await apiJoin(p1.accessToken, game.id);
  await apiJoin(p2.accessToken, game.id);
  const contexts = await Promise.all(
    [host, p1, p2].map((p) => openContextWithToken(browser, p.accessToken)),
  );
  try {
    const [admin, first, second] = (await Promise.all(contexts.map((c) => c.newPage()))) as [
      Page,
      Page,
      Page,
    ];
    await Promise.all([admin, first, second].map((p) => p.goto(`/session/${game.id}`)));
    await admin.getByRole('button', { name: 'Начать игру', exact: true }).click();
    async function offer(page: Page, amount: number) {
      await page.getByLabel('Сумма предложения').fill(String(amount));
      await page.getByRole('button', { name: `Предложить ${amount} монет`, exact: true }).click();
    }
    await Promise.all([offer(first, 40), offer(second, 60)]);
    await Promise.all(
      [first, second].map((p) => p.getByRole('button', { name: /Принять · получить/ }).click()),
    );
    const scores = admin.getByRole('list', { name: 'Счёт игроков' });
    await expect(scores.locator('li', { hasText: nick1 })).toContainText('120');
    await admin.reload();
    await expect(scores.locator('li', { hasText: nick1 })).toContainText('120');
    await expect(scores.locator('li', { hasText: nick2 })).toContainText('80');
    await admin.getByRole('button', { name: 'Следующий раунд', exact: true }).click();
    await expect(first.getByRole('heading', { name: 'Раунд 2 / 2' })).toBeVisible();
    await offer(first, 50);
    await offer(second, 50);
    await first.getByRole('button', { name: /Отклонить · обоим 0/ }).click();
    await second.getByRole('button', { name: /Принять · получить/ }).click();
    await expect(scores.locator('li', { hasText: nick1 })).toContainText('170');
    await expect(scores.locator('li', { hasText: nick2 })).toContainText('130');
    await admin.getByRole('button', { name: 'Завершить партию' }).click();
    await expect(first.getByRole('heading', { name: 'Игра завершена' })).toBeVisible();
    await first.getByRole('link', { name: 'Посмотреть результаты' }).click();
    await expect(first.getByRole('heading', { name: 'Лучший результат: 170 монет' })).toBeVisible();
    await first.getByText('Подробный анализ и все сделки', { exact: true }).click();
    await first.getByLabel('Найти игрока в сделках').fill(nick1);
    await expect(first.getByRole('button', { name: /Монеты/ })).toBeVisible();
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});
