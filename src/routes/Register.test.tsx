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

function renderRegister() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<div>home</div>} />
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
    await user.click(screen.getByRole('button', { name: /Присесть за стол/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/короче/i);
    // fetch не должен был быть вызван — валидация клиентская
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('submits with valid nickname + default PLAYER role, stores tokens, navigates to /', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { accessToken: 'acc-1', refreshToken: 'ref-1', expiresIn: 900 }),
    );

    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/Имя/i), 'Alice');
    await user.click(screen.getByRole('button', { name: /Присесть за стол/i }));

    // Wait for navigation
    expect(await screen.findByText('home')).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/auth/quick-register');
    expect(init?.body).toBe(JSON.stringify({ nickname: 'Alice', role: 'PLAYER' }));
    expect(authStorage.getAccess()).toBe('acc-1');
    expect(authStorage.getRefresh()).toBe('ref-1');
  });

  it('sends role: ADMIN when Ведущий toggled', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { accessToken: 'a', refreshToken: 'r', expiresIn: 900 }),
    );

    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/Имя/i), 'GameMaster');
    await user.click(screen.getByRole('radio', { name: /Ведущий/i }));
    await user.click(screen.getByRole('button', { name: /Присесть за стол/i }));

    await screen.findByText('home');
    const init = fetchMock.mock.calls[0]![1]!;
    expect(init.body).toBe(JSON.stringify({ nickname: 'GameMaster', role: 'ADMIN' }));
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
    await user.click(screen.getByRole('button', { name: /Присесть за стол/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/имя уже занято/i);
  });
});
