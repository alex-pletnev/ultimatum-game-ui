import { Client } from '@stomp/stompjs';
import { expect, test } from '@playwright/test';
import { ensureBackendUp, uniqueNickname } from './utils';
import type {
  JwtAuthenticationResponse,
  RoundResponse,
  SessionWithTeamsAndMembersResponse,
  UserResponse,
} from '../src/api/types';

const apiBase = 'http://localhost:8080/api/v1';
async function api<T>(path: string, token?: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  expect(response.status, path).toBeLessThan(300);
  return response.json() as Promise<T>;
}
async function connect(token: string): Promise<Client> {
  return new Promise((resolve, reject) => {
    const client = new Client({
      brokerURL: 'ws://localhost:8080/api/v1/ws',
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 0,
      connectionTimeout: 15000,
      onConnect: () => resolve(client),
      onStompError: () => reject(new Error('STOMP rejected')),
      onWebSocketError: () => reject(new Error('WebSocket failed')),
    });
    client.activate();
  });
}

test.beforeAll(ensureBackendUp);
for (const numTeams of [3, 4]) {
  test(`20 people in ${numTeams} teams finish after disconnect, autopilot and secret-code recovery`, async ({
    browser,
  }, testInfo) => {
    test.setTimeout(120000);
    const accounts = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        api<JwtAuthenticationResponse>('/auth/quick-register', undefined, {
          nickname: uniqueNickname(`group${i}`),
          role: 'PLAYER',
        }),
      ),
    );
    const people = await Promise.all(
      accounts.map((a) => api<UserResponse>('/user', a.accessToken)),
    );
    const host = accounts[0]!;
    const game = await api<SessionWithTeamsAndMembersResponse>('/session', host.accessToken, {
      displayName: `20 people · ${numTeams} teams`,
      hostPlays: true,
      config: {
        sessionType: 'TEAM_BATTLE',
        numRounds: 2,
        numTeams,
        numPlayers: 20,
        roundSum: 100,
        timeoutMoveSec: 60,
        anonymous: numTeams === 3,
      },
    });
    await Promise.all(
      accounts
        .slice(1)
        .map((a, index) =>
          api(
            `/session/${game.id}/join?teamId=${game.teams[(index + 1) % numTeams]!.id}`,
            a.accessToken,
            {},
          ),
        ),
    );
    const clients = await Promise.all(accounts.slice(1, 19).map((a) => connect(a.accessToken)));
    const context = await browser.newContext();
    const restoredContext = await browser.newContext();
    const page = await context.newPage();
    const returned = await restoredContext.newPage();
    try {
      await page.goto('/');
      await page.evaluate((a) => {
        localStorage.setItem('ug:accessToken', a.accessToken);
        localStorage.setItem('ug:refreshToken', a.refreshToken!);
      }, host);
      await page.goto(`/session/${game.id}`);
      await page.getByRole('button', { name: 'Начать игру', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Раунд 1 / 2' })).toBeVisible();
      await page.getByText('Игрок отключился · автопилот', { exact: true }).click();
      await page
        .getByRole('button', { name: `Включить автопилот: ${people[19]!.nickname}`, exact: true })
        .click();
      await page.getByRole('spinbutton', { name: 'Точная сумма' }).fill('37');
      await page.getByRole('button', { name: 'Предложить 37 монет', exact: true }).click();
      clients.forEach((c) =>
        c.publish({ destination: `/app/session/${game.id}/offer.create`, body: '{"amount":50}' }),
      );
      await expect
        .poll(
          async () =>
            (await api<RoundResponse>(`/session/${game.id}/current-round`, host.accessToken))
              .roundPhase,
        )
        .toBe('OFFERS_SENT');
      const round = await api<RoundResponse>(`/session/${game.id}/current-round`, host.accessToken);
      for (const person of numTeams === 3 ? people : []) {
        expect(JSON.stringify(round.offers)).not.toContain(person.nickname);
        expect(JSON.stringify(round.offers)).not.toContain(person.id);
      }
      const respond = async () => {
        await Promise.all(
          clients.map(async (c, i) => {
            const current = await api<RoundResponse>(
              `/session/${game.id}/current-round`,
              accounts[i + 1]!.accessToken,
            );
            c.publish({
              destination: `/app/session/${game.id}/make.decision`,
              body: JSON.stringify({
                offerId: current.myPendingActions[0]!.offerId,
                decision: i !== 0,
              }),
            });
          }),
        );
      };
      await respond();
      await page.getByRole('button', { name: /Принять · получить/ }).click();
      await expect(page.getByRole('heading', { name: 'Общий счёт', exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByRole('list', { name: 'Счёт игроков' }).locator('li')).toHaveCount(20);
      await returned.goto(`/register?next=${encodeURIComponent(`/session/${game.id}`)}`);
      await returned.getByRole('button', { name: 'Вернуться по коду' }).click();
      await returned
        .getByLabel('Код восстановления', { exact: true })
        .fill(accounts[19]!.recoveryCode!);
      await returned.getByRole('button', { name: 'Восстановить вход', exact: true }).click();
      await expect(returned.getByText('Вы — игрок', { exact: true })).toBeVisible();
      await page.getByText('Игрок отключился · автопилот', { exact: true }).click();
      await page
        .getByRole('button', { name: `Выключить автопилот: ${people[19]!.nickname}`, exact: true })
        .click();
      await page.getByRole('button', { name: 'Следующий раунд', exact: true }).click();
      await expect(returned.getByRole('heading', { name: 'Раунд 2 / 2' })).toBeVisible();
      await Promise.all(
        [page, returned].map((p) =>
          p.getByRole('button', { name: 'Предложить 50 монет', exact: true }).click(),
        ),
      );
      clients.forEach((c) =>
        c.publish({ destination: `/app/session/${game.id}/offer.create`, body: '{"amount":50}' }),
      );
      await expect
        .poll(
          async () =>
            (await api<RoundResponse>(`/session/${game.id}/current-round`, host.accessToken))
              .roundPhase,
        )
        .toBe('OFFERS_SENT');
      await respond();
      await Promise.all(
        [page, returned].map((p) => p.getByRole('button', { name: /Принять · получить/ }).click()),
      );
      await page.getByRole('button', { name: 'Завершить партию', exact: true }).click();
      await page.getByRole('link', { name: 'Посмотреть результаты', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Результаты команд', exact: true }),
      ).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('teams-desktop.png'), fullPage: true });
      await page.getByRole('combobox', { name: 'Раунды команд' }).selectOption('2');
      await page.setViewportSize({ width: 390, height: 844 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      await page.screenshot({ path: testInfo.outputPath('teams-mobile.png'), fullPage: true });
      const csv = await (await fetch(`${apiBase}/statistics/${game.id}/csv`)).text();
      expect(csv.trim().split('\n')).toHaveLength(41);
      expect(csv).toContain('offerAutomatic');
      for (const person of people) {
        if (numTeams === 3) expect(csv).not.toContain(person.id);
        else expect(csv).toContain(person.id);
      }
      await page.goto(`/session/${game.id}`);
      await page.getByRole('button', { name: 'Реванш с теми же настройками' }).click();
      await expect(page).not.toHaveURL(new RegExp(game.id));
      const rematchId = page.url().split('/').at(-1)!;
      const rematch = await api<SessionWithTeamsAndMembersResponse>(
        `/session/${rematchId}/with-teams-and-members`,
        host.accessToken,
      );
      expect(rematch.teams).toHaveLength(numTeams);
      expect(rematch.config.anonymous).toBe(numTeams === 3);
    } finally {
      await Promise.all(clients.map((c) => c.deactivate()));
      await context.close();
      await restoredContext.close();
    }
  });
}
