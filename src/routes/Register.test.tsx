import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Register } from './Register';
import { authStorage } from '../api/auth-storage';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderRegister(entry = '/register') {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/history" element={<div>history</div>} />
          <Route path="/lobby" element={<div>games</div>} />
          <Route path="/lobby/new" element={<div>create</div>} />
          <Route path="/session/:id" element={<div>invitation</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Register', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows local validation for too-short nickname', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/Имя/i), 'ab');
    await user.click(screen.getByRole('button', { name: /Продолжить/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/3/);
    // fetch не должен был быть вызван — валидация клиентская
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('submits with valid nickname + default PLAYER role, stores tokens, navigates to games', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { accessToken: 'acc-1', refreshToken: 'ref-1', expiresIn: 900 }),
    );

    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/Имя/i), 'Alice');
    await user.click(screen.getByRole('button', { name: /Продолжить/i }));

    // Wait for navigation
    expect(await screen.findByText('games')).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/auth/quick-register');
    expect(init?.body).toBe(JSON.stringify({ nickname: 'Alice', role: 'PLAYER' }));
    expect(authStorage.getAccess()).toBe('acc-1');
    expect(authStorage.getRefresh()).toBe('ref-1');
  });

  it('registers a player and opens setup when hosting is selected', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { accessToken: 'a', refreshToken: 'r', expiresIn: 900 }),
    );

    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/Имя/i), 'GameMaster');
    await user.click(screen.getByRole('radio', { name: /Создать игру/i }));
    await user.click(screen.getByRole('button', { name: /Продолжить/i }));

    await screen.findByText('create');
    const init = fetchMock.mock.calls[0]![1]!;
    expect(init.body).toBe(JSON.stringify({ nickname: 'GameMaster', role: 'PLAYER' }));
  });

  it('preserves a session invitation after registration', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(200, { accessToken: 'a', refreshToken: 'r', expiresIn: 900 }),
    );
    const user = userEvent.setup();
    renderRegister('/register?next=%2Fsession%2Finvited');
    await user.type(screen.getByLabelText(/Имя/i), 'Guest');
    await user.click(screen.getByRole('button', { name: /Продолжить/i }));
    expect(await screen.findByText('invitation')).toBeInTheDocument();
  });

  it('ignores an external redirect', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(200, { accessToken: 'a', refreshToken: 'r', expiresIn: 900 }),
    );
    const user = userEvent.setup();
    renderRegister('/register?next=https://example.com');
    await user.type(screen.getByLabelText(/Имя/i), 'Guest');
    await user.click(screen.getByRole('button', { name: /Продолжить/i }));
    expect(await screen.findByText('games')).toBeInTheDocument();
  });

  it.each([
    ['/register?next=%2Fsession%2Finvited', 'invitation'],
    ['/register', 'history'],
  ])('restores a profile from %s to %s', async (entry, destination) => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(200, { accessToken: 'a', refreshToken: 'r', expiresIn: 900 }),
    );
    const user = userEvent.setup();
    renderRegister(entry);
    await user.click(screen.getByRole('button', { name: 'Вернуться по коду' }));
    await user.type(screen.getByLabelText('Код восстановления'), 'secret-recovery-code');
    await user.click(screen.getByRole('button', { name: 'Восстановить вход' }));
    expect(await screen.findByText(destination)).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls[0]![0]).toContain('/auth/quick-login');
    expect(vi.mocked(fetch).mock.calls[0]![1]!.body).toBe(
      JSON.stringify({ recoveryCode: 'secret-recovery-code' }),
    );
  });

  it('shows backend 400 message', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        timestamp: '2026-07-15T00:00:00.000+00:00',
        status: 400,
        error: 'Bad Request',
        message: 'nickname: имя уже занято',
        path: '/api/v1/auth/quick-register',
      }),
    );

    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/Имя/i), 'Alice');
    await user.click(screen.getByRole('button', { name: /Продолжить/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/имя уже занято/i);
  });
});
