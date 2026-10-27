import { expect, test } from '@playwright/test';
import {
  apiCreateSession,
  apiJoin,
  apiRegister,
  ensureBackendUp,
  openContextWithToken,
  uniqueNickname,
} from './utils';

test.beforeAll(ensureBackendUp);
test('host cannot start alone, sees new players and starts once ready', async ({ browser }) => {
  const host = await apiRegister(uniqueNickname('start'), 'ADMIN');
  const game = await apiCreateSession(host.accessToken, 'Старт', 2);
  const context = await openContextWithToken(browser, host.accessToken);
  try {
    const page = await context.newPage();
    await page.goto(`/session/${game.id}`);
    const start = page.getByRole('button', { name: 'Начать игру', exact: true });
    await expect(start).toBeDisabled();
    for (const prefix of ['first', 'second']) {
      const player = await apiRegister(uniqueNickname(prefix), 'PLAYER');
      await apiJoin(player.accessToken, game.id);
    }
    await expect(start).toBeEnabled({ timeout: 15000 });
    await start.click();
    await expect(page.getByRole('heading', { name: 'Раунд 1 / 1' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Игроки делают предложения' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('an aborted automatic game can continue even when scores are unavailable', async ({
  browser,
  request,
}) => {
  const host = await apiRegister(uniqueNickname('abort'), 'ADMIN');
  const response = await request.post('http://localhost:8080/api/v1/session', {
    headers: { Authorization: `Bearer ${host.accessToken}` },
    data: {
      displayName: 'Прерывание',
      config: {
        sessionType: 'FREE_FOR_ALL',
        numRounds: 2,
        numTeams: 0,
        numPlayers: 2,
        roundSum: 100,
        timeoutMoveSec: 60,
        autoAdvanceRounds: true,
      },
    },
  });
  expect(response.ok()).toBe(true);
  const game = (await response.json()) as { id: string };
  for (const prefix of ['a', 'b']) {
    const player = await apiRegister(uniqueNickname(prefix), 'PLAYER');
    await apiJoin(player.accessToken, game.id);
  }
  const context = await openContextWithToken(browser, host.accessToken);
  try {
    const page = await context.newPage();
    await page.route('**/statistics/*/score', (route) =>
      route.fulfill({ status: 503, body: 'Temporarily unavailable' }),
    );
    await page.goto(`/session/${game.id}`);
    await page.getByRole('button', { name: 'Начать игру', exact: true }).click();
    await page.getByRole('button', { name: 'Прервать раунд', exact: true }).click();
    await page.getByRole('button', { name: 'Да, прервать', exact: true }).click();
    await expect(page.getByText('Не удалось загрузить счёт.', { exact: false })).toBeVisible({
      timeout: 15000,
    });
    await page
      .getByRole('button', { name: 'Следующий раунд', exact: true })
      .click({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Раунд 2 / 2' })).toBeVisible();
  } finally {
    await context.close();
  }
});
