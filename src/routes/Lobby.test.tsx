import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Lobby } from './Lobby';
import { authStorage } from '../api/auth-storage';
import type { SessionResponse } from '../api/types';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderLobby() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/lobby']}>
        <Routes>
          <Route path="/" element={<div>home</div>} />
          <Route path="/lobby" element={<Lobby />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const sampleSession = (overrides?: Partial<SessionResponse>): SessionResponse => ({
  id: 'sess-1',
  displayName: 'Круг наивных',
  state: 'CREATED',
  createdAt: '2026-07-15T09:00:00.000+00:00',
  admin: { id: 'u-1', nickname: 'Merlin', role: 'ADMIN', createdAt: '2026-07-15T08:00:00.000+00:00' },
  openToConnect: true,
  rounds: [],
  config: {
    sessionType: 'FREE_FOR_ALL',
    numRounds: 5,
    numTeams: 0,
    numPlayers: 4,
    roundSum: 100,
    timeoutMoveSec: 60,
  },
  teams: [{ id: 't-1', name: 'all', size: 2 }],
  currentRound: null,
  ...overrides,
});

describe('Lobby', () => {
  beforeEach(() => {
    authStorage.setTokens('access-1', 'refresh-1');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects to / if no access token', async () => {
    authStorage.clear();
    renderLobby();
    expect(await screen.findByText('home')).toBeInTheDocument();
  });

  it('shows empty state when backend returns 0 sessions', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(200, { content: [], totalElements: 0, totalPages: 0, number: 0, size: 30 }),
    );
    renderLobby();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Стол пуст/i })).toBeInTheDocument(),
    );
  });

  it('renders session cards when backend returns data', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(200, {
        content: [sampleSession(), sampleSession({ id: 'sess-2', displayName: 'Совет старейшин' })],
        totalElements: 2,
        totalPages: 1,
        number: 0,
        size: 30,
      }),
    );
    renderLobby();

    await waitFor(() =>
      expect(screen.getByText('Круг наивных')).toBeInTheDocument(),
    );
    expect(screen.getByText('Совет старейшин')).toBeInTheDocument();
    // Ведущий и параметры отображаются
    expect(screen.getAllByText(/ведущий · Merlin/i)).toHaveLength(2);
    expect(screen.getAllByText('2/4')).toHaveLength(2);
  });

  it('shows error state with retry button when request fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(500, {
        timestamp: '',
        status: 500,
        error: 'Internal',
        message: 'boom',
        path: '/api/v1/session',
      }),
    );
    renderLobby();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Стол не отвечает/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /Постучать снова/i })).toBeInTheDocument();
  });
});
