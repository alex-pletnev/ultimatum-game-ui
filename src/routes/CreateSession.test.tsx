import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateSession } from './CreateSession';
import { authStorage } from '../api/auth-storage';
import type { Role } from '../api/types';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockUserWith(role: Role) {
  vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/user')) {
      return Promise.resolve(
        jsonResponse(200, {
          id: 'u-me',
          nickname: 'me',
          role,
          createdAt: '2026-07-15T08:00:00.000+00:00',
        }),
      );
    }
    if (url.endsWith('/session') || url.endsWith('/api/v1/session')) {
      return Promise.resolve(
        jsonResponse(201, {
          id: 'sess-new',
          displayName: 'ok',
          state: 'CREATED',
          createdAt: '2026-07-15T09:00:00.000+00:00',
          admin: { id: 'u-me', nickname: 'me', role, createdAt: '' },
          openToConnect: true,
          rounds: [],
          config: {
            sessionType: 'FREE_FOR_ALL',
            numRounds: 3,
            numTeams: 0,
            numPlayers: 4,
            roundSum: 100,
            timeoutMoveSec: 60,
          },
          teams: [],
          currentRound: null,
        }),
      );
    }
    return Promise.resolve(jsonResponse(404, { message: 'not mocked' }));
  });
}

function renderCreate() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/lobby/new']}>
        <Routes>
          <Route path="/" element={<div>home</div>} />
          <Route path="/lobby" element={<div>lobby</div>} />
          <Route path="/lobby/new" element={<CreateSession />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CreateSession', () => {
  beforeEach(() => {
    authStorage.setTokens('access-1', 'refresh-1');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects PLAYER to /lobby (guard)', async () => {
    mockUserWith('PLAYER');
    renderCreate();
    await waitFor(() => expect(screen.getByText('lobby')).toBeInTheDocument());
  });

  it('redirects to / if no token', async () => {
    authStorage.clear();
    renderCreate();
    expect(await screen.findByText('home')).toBeInTheDocument();
  });

  it('ADMIN can submit with FFA defaults', async () => {
    mockUserWith('ADMIN');
    const user = userEvent.setup();
    renderCreate();

    // Дождаться, что форма отрисовалась (после загрузки user)
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Учредить партию/i })).toBeInTheDocument(),
    );

    await user.type(screen.getByLabelText(/Название партии/i), 'Круг наивных');
    await user.click(screen.getByRole('button', { name: /Огласить партию/i }));

    // Redirect на /lobby
    await waitFor(() => expect(screen.getByText('lobby')).toBeInTheDocument());

    // Проверить, что был вызов POST /session с правильным body
    const postCall = vi
      .mocked(fetch)
      .mock.calls.find(([url, init]) => {
        const u = typeof url === 'string' ? url : url?.toString() ?? '';
        return u.endsWith('/session') && init?.method === 'POST';
      });
    expect(postCall).toBeDefined();
    const body = JSON.parse(postCall![1]!.body as string);
    expect(body).toMatchObject({
      displayName: 'Круг наивных',
      config: {
        sessionType: 'FREE_FOR_ALL',
        numRounds: 3,
        numTeams: 0,
        numPlayers: 4,
        roundSum: 100,
        timeoutMoveSec: 60,
      },
    });
  });

  it('shows numTeams stepper only for TEAM_BATTLE', async () => {
    mockUserWith('ADMIN');
    const user = userEvent.setup();
    renderCreate();

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Учредить партию/i })).toBeInTheDocument(),
    );
    expect(screen.queryByText(/^Команд$/i)).toBeNull();

    await user.click(screen.getByRole('radio', { name: /Битва команд/i }));
    expect(screen.getByText(/^Команд$/i)).toBeInTheDocument();
  });
});
