import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router';
import { SessionInvite } from './SessionInvite';

it('preserves the deployment path and hash route when sharing a game', async () => {
  window.history.replaceState(null, '', '/ultimatum-game-ui/#/session/game-id');
  const user = userEvent.setup();
  render(
    <HashRouter>
      <SessionInvite id="game-id" name="Наша партия" />
    </HashRouter>,
  );
  const url = `${window.location.origin}/ultimatum-game-ui/#/session/game-id`;
  expect(screen.getByLabelText('Пригласите друзей')).toHaveValue(url);
  expect(screen.getByRole('img', { name: 'QR-код приглашения в игру' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Копировать ссылку' }));
  expect(await navigator.clipboard.readText()).toBe(url);
  expect(screen.getByRole('button', { name: 'Скопировано' })).toBeVisible();
});

it('keeps the selectable URL available when clipboard access fails', async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('Denied'));
  render(
    <HashRouter>
      <SessionInvite id="another-game" name="Партия" />
    </HashRouter>,
  );
  await user.click(screen.getByRole('button', { name: 'Копировать ссылку' }));
  expect(screen.getByRole('status')).toHaveTextContent('Выделите ссылку');
  expect(screen.getByLabelText('Пригласите друзей')).toHaveAttribute('readonly');
});
