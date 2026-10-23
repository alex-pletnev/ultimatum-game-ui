import { expect, test } from '@playwright/test';
import { apiRegister, ensureBackendUp, openContextWithToken, uniqueNickname } from './utils';

test.beforeAll(ensureBackendUp);
for (const dictator of [false, true]) {
  test(`solo ${dictator ? 'dictator' : 'ultimatum'} completes, records history and creates a rematch`, async ({
    browser,
  }) => {
    const account = await apiRegister(uniqueNickname('solo'), 'PLAYER');
    const context = await openContextWithToken(browser, account.accessToken);
    try {
      const page = await context.newPage();
      await page.goto('/play');
      if (dictator) await page.getByRole('radio', { name: /Диктатор/ }).check();
      await page.getByRole('button', { name: 'Начать игру с ботом' }).click();
      await expect(page).toHaveURL(/\/session\/[a-f0-9-]+$/);
      const original = page.url();
      await expect(page.getByText('Вы играете и ведёте', { exact: true })).toBeVisible();
      for (let round = 1; round <= 3; round++) {
        await expect(page.getByRole('heading', { name: `Раунд ${round} / 3` })).toBeVisible();
        if (dictator) await expect(page.getByText(/отказаться нельзя/)).toBeVisible();
        await page.getByRole('button', { name: 'Предложить 50 монет', exact: true }).click();
        if (!dictator) await page.getByRole('button', { name: /Принять · получить/ }).click();
        await expect(page.getByRole('list', { name: 'Счёт игроков' })).toContainText(
          String(round * 100),
        );
        await page
          .getByRole('button', {
            name: round === 3 ? 'Завершить партию' : 'Следующий раунд',
            exact: true,
          })
          .click();
      }
      await expect(page.getByRole('heading', { name: 'Игра завершена' })).toBeVisible();
      await page.getByRole('link', { name: 'Посмотреть результаты', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Лучший результат: 300 монет' }),
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Накопленный счёт' })).toBeVisible();
      await page.getByText('Подробный анализ и все сделки', { exact: true }).click();
      await page.getByRole('combobox', { name: 'Раунд', exact: true }).selectOption('2');
      await expect(page.getByText(/Выбрано сделок: 2\./)).toBeVisible();
      await page.getByRole('button', { name: 'Сбросить фильтры' }).click();
      await expect(page.getByText(/Выбрано сделок: 6\./)).toBeVisible();
      await page.getByRole('link', { name: 'Мои игры', exact: true }).click();
      await expect(page.getByRole('link', { name: 'Результаты', exact: true })).toBeVisible();
      await page.goto(original);
      await page.getByRole('button', { name: 'Реванш с теми же настройками' }).click();
      await expect(page).not.toHaveURL(original);
      await expect(page.getByLabel('Пригласите друзей')).toBeVisible();
    } finally {
      await context.close();
    }
  });
}

test('mobile guide is navigable and solo registration keeps the destination', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/guide');
  await page.getByRole('button', { name: 'Вопросы', exact: true }).click();
  await page.getByText('Где мои прошлые игры?', { exact: true }).click();
  await expect(page.getByText(/История привязана к временному профилю/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/play');
  await page.getByLabel('Имя', { exact: true }).fill(uniqueNickname('entry'));
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Вы против бота' })).toBeVisible();
});

test('a player hosts and plays a balanced team game with bots', async ({ browser }) => {
  const account = await apiRegister(uniqueNickname('team-host'), 'PLAYER');
  const context = await openContextWithToken(browser, account.accessToken);
  try {
    const page = await context.newPage();
    await page.goto('/lobby/new');
    await page.getByRole('button', { name: /Командный вызов/ }).click();
    await page.getByRole('button', { name: 'Создать игру', exact: true }).click();
    await page.getByText('Не хватает игроков? Добавить ботов', { exact: true }).click();
    await page.getByRole('button', { name: 'Заполнить свободные места ботами' }).click();
    await page.getByRole('button', { name: 'Начать игру', exact: true }).click();
    await page.getByRole('button', { name: 'Предложить 50 монет', exact: true }).click();
    await page.getByRole('button', { name: /Принять · получить/ }).click();
    await expect(page.getByRole('list', { name: 'Счёт игроков' })).toContainText('100');
    await page.getByRole('button', { name: 'Следующий раунд', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Раунд 2 / 5' })).toBeVisible();
  } finally {
    await context.close();
  }
});
