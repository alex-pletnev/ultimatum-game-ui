import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionJoin } from './SessionJoin';
import type { SessionWithTeamsAndMembersResponse, UserResponse } from '../api/types';

const player: UserResponse = { id: 'player', nickname: 'Alex', role: 'PLAYER', createdAt: '' };
const session: SessionWithTeamsAndMembersResponse = {
  id: 'game',
  displayName: 'Game',
  state: 'CREATED',
  createdAt: '',
  admin: { ...player, id: 'host', role: 'ADMIN' },
  openToConnect: true,
  config: {
    sessionType: 'TEAM_BATTLE',
    numPlayers: 4,
    numTeams: 2,
    numRounds: 3,
    roundSum: 100,
    timeoutMoveSec: 60,
  },
  currentRound: null,
  members: [],
  observers: [],
  teams: [
    { id: 'red', name: 'Red', members: [] },
    { id: 'blue', name: 'Blue', members: [] },
  ],
};
function setup(game = session) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<SessionJoin session={game} user={player} />} />
          <Route path="/session/:id" element={<div>joined</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
it('joins the selected team and opens the game', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ...session, members: [player] }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
  const user = userEvent.setup();
  setup();
  await user.selectOptions(screen.getByLabelText('Команда'), 'blue');
  await user.click(screen.getByRole('button', { name: 'Присоединиться' }));
  expect(await screen.findByText('joined')).toBeInTheDocument();
  expect(vi.mocked(fetch).mock.calls[0]![0]).toContain('/session/game/join?teamId=blue');
});
it('lets an existing participant return even when the game is full and closed', () => {
  setup({ ...session, openToConnect: false, state: 'RUNNING', members: [player] });
  expect(screen.getByRole('link', { name: 'Вернуться в игру' })).toHaveAttribute(
    'href',
    '/session/game',
  );
  expect(screen.queryByRole('button', { name: 'Присоединиться' })).toBeNull();
});
it('explains a closed game instead of offering a failing join action', () => {
  setup({ ...session, openToConnect: false });
  expect(screen.getByText(/Вход в эту игру закрыт/)).toBeInTheDocument();
});

it('prevents filling one team beyond half of the available seats', () => {
  setup({
    ...session,
    teams: [
      {
        id: 'red',
        name: 'Red',
        members: [
          { ...player, id: 'a' },
          { ...player, id: 'b' },
        ],
      },
      session.teams[1]!,
    ],
  });
  expect(screen.getByRole('option', { name: /Red/ })).toBeDisabled();
});
