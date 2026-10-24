import { expect, test } from '@playwright/test';
import jsQR from 'jsqr';
import {
  apiCreateSession,
  apiJoin,
  apiRegister,
  ensureBackendUp,
  openContextWithToken,
  uniqueNickname,
} from './utils';

test.beforeAll(ensureBackendUp);

test('projector invitation joins a new player and host fills remaining seats with random bots', async ({
  browser,
}) => {
  const host = await apiRegister(uniqueNickname('qr-host'), 'PLAYER');
  const hostContext = await openContextWithToken(browser, host.accessToken);
  const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await hostContext.newPage();
    await page.goto('/lobby/new');
    await page.getByRole('button', { name: 'Создать игру', exact: true }).click();
    const url = await page.getByLabel('Пригласите друзей').inputValue();
    const enlarge = page.getByRole('button', { name: 'Увеличить QR-код' });
    await enlarge.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('img')).toBeVisible();
    const pixels = await dialog.getByRole('img').evaluate(async (svg) => {
      const image = new Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 640;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0, 640, 640);
      return Array.from(context.getImageData(0, 0, 640, 640).data);
    });
    expect(jsQR(new Uint8ClampedArray(pixels), 640, 640)?.data).toBe(url);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(enlarge).toBeFocused();
    const guestPage = await guestContext.newPage();
    await guestPage.goto(url);
    const nickname = uniqueNickname('qr-guest');
    await guestPage.getByLabel('Имя', { exact: true }).fill(nickname);
    await guestPage.getByRole('button', { name: 'Продолжить', exact: true }).click();
    await guestPage.getByRole('button', { name: 'Присоединиться', exact: true }).click();
    await expect(guestPage.getByText('Вы в игре. Ждём начала')).toBeVisible();
    await expect(
      guestPage.getByRole('button', { name: 'Заполнить случайными ботами' }),
    ).toHaveCount(0);
    expect(await guestPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await guestPage.getByRole('button', { name: 'Увеличить QR-код' }).click();
    await expect(guestPage.getByRole('dialog')).toBeVisible();
    await guestPage.getByRole('button', { name: 'Закрыть', exact: true }).click();
    await expect(guestPage.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText(nickname, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Заполнить случайными ботами' }).click();
    await expect(page.getByText('Все места заняты. Можно начинать.')).toBeVisible();
    await page.getByRole('button', { name: 'Начать игру', exact: true }).click();
    await expect(guestPage.getByRole('heading', { name: /Раунд 1/ })).toBeVisible();
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});

test('large coin amounts remain readable on a narrow phone', async ({ browser }) => {
  const host = await apiRegister(uniqueNickname('large-coins'), 'PLAYER');
  const game = await apiCreateSession(host.accessToken, 'Large coins', 2, 1, 100000);
  await apiJoin(host.accessToken, game.id);
  const context = await openContextWithToken(browser, host.accessToken);
  try {
    const page = await context.newPage();
    await page.setViewportSize({ width: 320, height: 780 });
    await page.goto(`/session/${game.id}`);
    await page.getByRole('button', { name: 'Заполнить случайными ботами' }).click();
    await page.getByRole('button', { name: 'Начать игру', exact: true }).click();
    await page.getByRole('slider', { name: 'Сумма предложения' }).fill('100000');
    await expect(page.getByRole('button', { name: 'Предложить 100000 монет' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  } finally {
    await context.close();
  }
});
