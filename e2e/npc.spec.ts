import { expect, test } from '@playwright/test';
import { apiRegister, ensureBackendUp, openContextWithToken, uniqueNickname } from './utils';

test.beforeAll(ensureBackendUp);
test('host creates and confirms deletion of a bot', async ({ browser }) => {
  const host = await apiRegister(uniqueNickname('bots'), 'ADMIN');
  const context = await openContextWithToken(browser, host.accessToken);
  try {
    const page = await context.newPage();
    await page.goto('/npc');
    const name = uniqueNickname('bot');
    await page.getByLabel('Имя бота').fill(name);
    await page.getByRole('button', { name: 'Создать бота', exact: true }).click();
    const card = page.getByTestId(`npc-card-${name}`);
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Удалить', exact: true }).click();
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Да, удалить', exact: true }).click();
    await expect(card).toHaveCount(0);
  } finally {
    await context.close();
  }
});
test('fill seats with bots, automatically play three rounds and finish', async ({ browser }) => {
  const host = await apiRegister(uniqueNickname('simulation'), 'ADMIN');
  const context = await openContextWithToken(browser, host.accessToken);
  try {
    const page = await context.newPage();
    await page.goto('/lobby/new');
    await page.getByRole('checkbox', { name: /Я тоже играю/ }).uncheck();
    await page.getByText('Дополнительные настройки', { exact: true }).click();
    await page.getByRole('checkbox', { name: /Начинать следующий раунд автоматически/ }).check();
    await page.getByRole('button', { name: 'Создать игру', exact: true }).click();
    await page.getByText('Не хватает игроков? Добавить ботов', { exact: true }).click();
    await page.getByRole('button', { name: 'Заполнить свободные места ботами' }).click();
    await expect(page.getByText('4 из 4 мест занято.', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Начать игру', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Раунд 3 / 3' })).toBeVisible({
      timeout: 30000,
    });
    await page.getByRole('button', { name: 'Завершить партию' }).click();
    await expect(page.getByRole('heading', { name: 'Игра завершена' })).toBeVisible();
    await page.getByRole('link', { name: 'Посмотреть результаты' }).click();
    await expect(page.getByRole('heading', { name: /Лучший результат:/ })).toBeVisible();
  } finally {
    await context.close();
  }
});
