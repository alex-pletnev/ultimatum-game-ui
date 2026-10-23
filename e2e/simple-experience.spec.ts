import { expect, test } from '@playwright/test';
import { apiRegister, ensureBackendUp, uniqueNickname } from './utils';

test('practice needs no backend, works on a phone and has no horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route('**/api/v1/**', (route) => route.abort());
  await page.goto('/');
  await expect(
    page.getByRole('link', { name: 'Попробовать без регистрации', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('home-mobile.png'), fullPage: true });
  await page.getByRole('link', { name: 'Попробовать без регистрации', exact: true }).click();
  await page.getByRole('slider').fill('40');
  await page.getByRole('button', { name: 'Предложить 40 монет' }).click();
  await expect(page.getByText(/Вы получили 60/)).toBeVisible();
  await page.getByRole('button', { name: /Теперь ваш ответ/ }).click();
  await page.getByRole('button', { name: /Отклонить/ }).click();
  await expect(page.getByText(/Оба получили 0/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Попробовать ещё' }).click();
  await page.getByRole('slider').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('slider')).toHaveValue('51');
  await page.setViewportSize({ width: 812, height: 375 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('an invitation survives registration and lets a player select a team', async ({
  page,
  request,
}) => {
  await ensureBackendUp();
  const host = await apiRegister(uniqueNickname('invite'), 'ADMIN');
  const response = await request.post('http://localhost:8080/api/v1/session', {
    headers: { Authorization: `Bearer ${host.accessToken}` },
    data: {
      displayName: 'Друзья',
      config: {
        sessionType: 'TEAM_BATTLE',
        numRounds: 1,
        numTeams: 2,
        numPlayers: 4,
        roundSum: 100,
        timeoutMoveSec: 60,
      },
    },
  });
  expect(response.ok()).toBe(true);
  const game = (await response.json()) as {
    id: string;
    teams: Array<{ id: string; name: string }>;
  };
  await page.goto(`/session/${game.id}`);
  await expect(page.getByText('Приглашение в игру', { exact: true })).toBeVisible();
  await page.getByLabel('Имя', { exact: true }).fill(uniqueNickname('guest'));
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page).toHaveURL(`/session/${game.id}`);
  await page.getByLabel('Команда', { exact: true }).selectOption(game.teams[1]!.id);
  await page.getByRole('button', { name: 'Присоединиться', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Вы в игре. Ждём начала' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Вы в игре. Ждём начала' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Присоединиться', exact: true })).toHaveCount(0);
});

test('desktop landing and keyboard navigation stay readable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.screenshot({ path: test.info().outputPath('home-desktop.png'), fullPage: true });
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'К содержимому' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#content')).toBeFocused();
});

test('simultaneous invitations cannot overfill a team and the other team stays joinable', async ({
  request,
}) => {
  await ensureBackendUp();
  const host = await apiRegister(uniqueNickname('race'), 'ADMIN');
  const response = await request.post('http://localhost:8080/api/v1/session', {
    headers: { Authorization: `Bearer ${host.accessToken}` },
    data: {
      displayName: 'Одновременный вход',
      config: {
        sessionType: 'TEAM_BATTLE',
        numRounds: 1,
        numTeams: 2,
        numPlayers: 4,
        roundSum: 100,
        timeoutMoveSec: 60,
      },
    },
  });
  expect(response.ok()).toBe(true);
  const game = (await response.json()) as { id: string; teams: Array<{ id: string }> };
  const players = [];
  for (let i = 0; i < 4; i++) players.push(await apiRegister(uniqueNickname(`race${i}`), 'PLAYER'));
  const join = (i: number, team: number) =>
    request.post(
      `http://localhost:8080/api/v1/session/${game.id}/join?teamId=${game.teams[team]!.id}`,
      { headers: { Authorization: `Bearer ${players[i]!.accessToken}` } },
    );
  expect((await join(0, 0)).ok()).toBe(true);
  expect((await join(1, 1)).ok()).toBe(true);
  const competing = await Promise.all([join(2, 0), join(3, 0)]);
  expect(competing.map((r) => r.status()).sort()).toEqual([200, 409]);
  expect((await join(competing[0]!.ok() ? 3 : 2, 1)).ok()).toBe(true);
  const result = await request.get(
    `http://localhost:8080/api/v1/session/${game.id}/with-teams-and-members`,
  );
  const final = (await result.json()) as { teams: Array<{ members: unknown[] }> };
  expect(final.teams.map((t) => t.members.length)).toEqual([2, 2]);
});
