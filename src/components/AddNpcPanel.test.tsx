import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AddNpcPanel } from './AddNpcPanel';
import type { SessionWithTeamsAndMembersResponse } from '../api/types';
const bulk = vi.hoisted(() => vi.fn());
vi.mock('../api/npc-queries', () => ({
  useNpcList: () => ({ data: [] }),
  useJoinNpc: () => ({}),
  useBulkAttachNpcs: () => ({ mutate: bulk }),
}));
const game: SessionWithTeamsAndMembersResponse = {
  id: 'game',
  displayName: 'Game',
  state: 'CREATED',
  createdAt: '',
  admin: { id: 'host', nickname: 'Host', role: 'ADMIN', createdAt: '' },
  openToConnect: true,
  currentRound: null,
  members: [],
  observers: [],
  teams: [],
  config: {
    numPlayers: 120,
    numRounds: 1,
    numTeams: 0,
    sessionType: 'FREE_FOR_ALL',
    roundSum: 100,
    timeoutMoveSec: 60,
  },
};
it('fills a large game in batches within the API limit', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <AddNpcPanel session={game} />
    </MemoryRouter>,
  );
  await user.click(screen.getByText('Не хватает игроков? Добавить ботов'));
  await user.click(screen.getByRole('button', { name: /Добавить 100 ботов/ }));
  expect(bulk).toHaveBeenCalledWith(expect.objectContaining({ count: 100 }));
});
it('does not fill an odd two-team game into an unplayable balance', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <AddNpcPanel
        session={{
          ...game,
          config: { ...game.config, numPlayers: 5, numTeams: 2, sessionType: 'TEAM_BATTLE' },
        }}
      />
    </MemoryRouter>,
  );
  await user.click(screen.getByText('Не хватает игроков? Добавить ботов'));
  await user.click(screen.getByRole('button', { name: /Заполнить свободные места ботами/ }));
  expect(bulk).toHaveBeenLastCalledWith(expect.objectContaining({ count: 4 }));
});
