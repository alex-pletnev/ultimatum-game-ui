#!/usr/bin/env node
/*
 * Ad-hoc screenshot тулза для быстрой визуальной проверки UI без падающего теста.
 * Использование (pnpm 11 не требует --):
 *   pnpm snap                                 → снять /
 *   pnpm snap --path /lobby                   → снять /lobby без auth
 *   pnpm snap --path /lobby --register player → сначала зарегистрировать
 *                                                уникального PLAYER, потом снять
 *   pnpm snap --path /lobby/new --register admin --out /tmp/create.png
 *
 * Требует поднятого dev-сервера на http://localhost:5173.
 * Backend нужен только если `--register`.
 */

import { chromium } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    path: { type: 'string', default: '/' },
    out: { type: 'string', default: '/tmp/snap.png' },
    register: { type: 'string' }, // "admin" | "player" | undefined
    base: { type: 'string', default: 'http://localhost:5173' },
    viewport: { type: 'string', default: '1280x900' },
    wait: { type: 'string', default: '500' },
  },
});

const [vw, vh] = values.viewport.split('x').map(Number);
const waitAfter = Number(values.wait);
const targetUrl = new URL(values.path, values.base).toString();

async function registerIfNeeded(page) {
  if (!values.register) return null;
  const role = values.register.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'PLAYER';
  const nickname = `snap-${randomBytes(3).toString('hex')}`;

  await page.goto(new URL('/register', values.base).toString());
  await page.getByLabel(/Имя/i).fill(nickname);
  if (role === 'ADMIN') {
    await page.getByRole('radio', { name: /Ведущий/i }).check({ force: true });
  }
  await page.getByRole('button', { name: /Присесть за стол/i }).click();
  // Ждём redirect на /
  await page.waitForURL(new URL('/', values.base).toString());
  return { nickname, role };
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: vw, height: vh } });
  const page = await context.newPage();

  const user = await registerIfNeeded(page);

  await page.goto(targetUrl);
  await page.waitForTimeout(waitAfter);
  await page.screenshot({ path: values.out, fullPage: true });

  await browser.close();
  console.log(
    `✔ snap → ${values.out} · ${values.path} · viewport ${vw}×${vh}` +
      (user ? ` · registered as ${user.nickname} (${user.role})` : ''),
  );
}

main().catch((e) => {
  console.error('✖ snap failed:', e.message);
  process.exit(1);
});
