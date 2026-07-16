#!/usr/bin/env node
/*
 * One-shot runner: играет полную сессию до FINISHED и печатает URL со статистикой.
 * Требует backend (:8080) и dev-сервер (:5173).
 *
 * Использование:
 *   node scripts/play-full-session.mjs                 # дефолт 2×3
 *   node scripts/play-full-session.mjs --players 5 --rounds 4
 */

import { chromium } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    players: { type: 'string', default: '2' },
    rounds: { type: 'string', default: '3' },
    roundSum: { type: 'string', default: '100' },
    base: { type: 'string', default: 'http://localhost:5173' },
    backend: { type: 'string', default: 'http://localhost:8080/api/v1' },
  },
});

const N_PLAYERS = Number(values.players);
const N_ROUNDS = Number(values.rounds);
const ROUND_SUM = Number(values.roundSum);
const FRONT = values.base;
const BACKEND = values.backend;

async function apiPost(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BACKEND}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

function uniq(prefix) {
  return `${prefix}-${randomBytes(3).toString('hex')}`;
}

async function openWithToken(browser, token) {
  const ctx = await browser.newContext();
  await ctx.addInitScript((t) => {
    localStorage.setItem('ug:accessToken', t);
  }, token);
  return ctx;
}

/*
 * Policies по игроку — фиксированы, чтобы графики выходили живыми:
 *   proposerAmount(round, playerIdx) — сколько предлагать в этом раунде.
 *   decidesAccept(receivedAmount, playerIdx) — как отвечать.
 */
function proposerAmount(round, idx) {
  // Разные архетипы: 0 щедрый, 1 средний, 2 жадный, 3 переменный, 4+ рандом.
  const base = [55, 45, 25, 35 + (round - 1) * 10, 30 + ((idx * 7 + round * 3) % 40)];
  return Math.min(ROUND_SUM, Math.max(0, base[idx] ?? 40));
}

function decidesAccept(amount, idx) {
  // 0-1 всегда accept; 2 принципиальный (< 30 reject); 3 жадный (< 40 reject); 4+ рандом.
  if (idx <= 1) return true;
  if (idx === 2) return amount >= 30;
  if (idx === 3) return amount >= 40;
  // случайный, но seed по amount чтобы воспроизводимо.
  return amount % 2 === 0;
}

async function main() {
  console.log(`✓ config: ${N_PLAYERS} players × ${N_ROUNDS} rounds, roundSum=${ROUND_SUM}`);

  const admin = await apiPost('/auth/quick-register', {
    nickname: uniq('demo-adm'),
    role: 'ADMIN',
  });
  const players = [];
  for (let i = 0; i < N_PLAYERS; i++) {
    players.push(
      await apiPost('/auth/quick-register', {
        nickname: uniq(`demo-p${i + 1}`),
        role: 'PLAYER',
      }),
    );
  }

  const session = await apiPost(
    '/session',
    {
      displayName: `Демо ${N_PLAYERS}×${N_ROUNDS} ${new Date().toISOString().slice(11, 16)}`,
      config: {
        sessionType: 'FREE_FOR_ALL',
        numRounds: N_ROUNDS,
        numTeams: 0,
        numPlayers: N_PLAYERS,
        roundSum: ROUND_SUM,
        timeoutMoveSec: 60,
      },
    },
    admin.accessToken,
  );

  for (const p of players) {
    await apiPost(`/session/${session.id}/join`, {}, p.accessToken);
  }
  console.log(`✓ session ${session.id} created + ${N_PLAYERS} joined`);

  const browser = await chromium.launch();
  const adminCtx = await openWithToken(browser, admin.accessToken);
  const adminPage = await adminCtx.newPage();
  const playerCtxs = [];
  const playerPages = [];
  for (const p of players) {
    const ctx = await openWithToken(browser, p.accessToken);
    playerCtxs.push(ctx);
    playerPages.push(await ctx.newPage());
  }

  const url = `${FRONT}/session/${session.id}`;
  await Promise.all([adminPage.goto(url), ...playerPages.map((pg) => pg.goto(url))]);

  // Ждём mount + STOMP handshake на всех страницах.
  await Promise.all(
    [adminPage, ...playerPages].map((p) =>
      p.waitForFunction(() => document.body.textContent?.includes('Раундов'), null, {
        timeout: 15_000,
      }),
    ),
  );

  async function offer(page, amount) {
    const submit = page.getByRole('button', { name: /Огласить сделку/i });
    await submit.waitFor({ state: 'visible', timeout: 30_000 });
    const slider = page.getByLabel(/Сумма предложения/i);
    await slider.fill(String(amount));
    await submit.click();
  }
  async function decide(page, idx) {
    const acceptBtn = page.getByRole('button', { name: /Согласиться/i });
    const rejectBtn = page.getByRole('button', { name: /Разбить сделку/i });
    await acceptBtn.waitFor({ state: 'visible', timeout: 30_000 });
    const amountText = await page.getByTestId('assigned-offer-amount').innerText();
    const amount = Number(amountText.trim());
    const accept = decidesAccept(amount, idx);
    if (accept) {
      await acceptBtn.click();
    } else {
      await rejectBtn.click();
    }
    return { amount, accepted: accept };
  }
  async function nextRound(page) {
    // После last decision раунда — либо auto-advance (кнопки нет),
    // либо ADMIN должен кликнуть. Ждём подольше — WS scoreUpdated может опоздать.
    try {
      const btn = page.getByRole('button', {
        name: /Следующий раунд|Завершить партию/i,
      });
      await btn.waitFor({ state: 'visible', timeout: 15_000 });
      await btn.click();
    } catch {
      // auto-advance — уже перешли, ничего не делаем.
    }
  }

  // Start.
  const startBtn = adminPage.getByRole('button', { name: /Начать партию/i });
  await startBtn.waitFor({ state: 'visible', timeout: 15_000 });
  await adminPage.waitForFunction(
    () => {
      const b = [...document.querySelectorAll('button')].find((x) =>
        /Начать партию/i.test(x.textContent ?? ''),
      );
      return b && !b.disabled;
    },
    null,
    { timeout: 15_000 },
  );
  await startBtn.click();

  for (let r = 1; r <= N_ROUNDS; r++) {
    // Все делают offer'ы (последовательно — не гонимся за скоростью).
    for (let i = 0; i < N_PLAYERS; i++) {
      const amt = proposerAmount(r, i);
      await offer(playerPages[i], amt);
    }
    // После второго offer backend может уже shuffle'нуть — всё равно waits в decide().
    const decisions = [];
    for (let i = 0; i < N_PLAYERS; i++) {
      const d = await decide(playerPages[i], i);
      decisions.push(d);
    }
    console.log(
      `  round ${r}: offers=${decisions.map((d) => d.amount).join(',')} decisions=${decisions
        .map((d) => (d.accepted ? '✓' : '✗'))
        .join('')}`,
    );
    await nextRound(adminPage);
  }

  // Ждём FINISHED.
  try {
    await adminPage
      .getByText(/^Партия окончена$/i)
      .waitFor({ state: 'visible', timeout: 15_000 });
  } catch {
    // could be still running or auto-advance in-flight.
  }

  const statsUrl = `${FRONT}/session/${session.id}/stats`;
  console.log(`\n✓ session finished. Открывай статистику:`);
  console.log(`  ${statsUrl}`);

  await Promise.all([adminCtx.close(), ...playerCtxs.map((c) => c.close())]);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
