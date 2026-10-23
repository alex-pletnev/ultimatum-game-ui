import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router';
import { AppShell } from './AppShell';

vi.mock('../api/auth-storage', () => ({ useAccessToken: () => null }));
vi.mock('../api/auth-queries', () => ({
  useCurrentUser: () => ({ data: null }),
  useLogout: () => ({}),
}));

it('keeps the first tab stop and skips to content without changing a hash route', async () => {
  window.history.replaceState(null, '', '/#/rules');
  const user = userEvent.setup();
  render(
    <HashRouter>
      <AppShell>
        <main>Rules</main>
      </AppShell>
    </HashRouter>,
  );
  await user.tab();
  expect(screen.getByRole('link', { name: 'К содержимому' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(document.getElementById('content')).toHaveFocus();
  expect(window.location.hash).toBe('#/rules');
  window.history.replaceState(null, '', '/');
});
