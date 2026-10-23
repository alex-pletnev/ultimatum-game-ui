import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSessionScore } from './session-queries';
import { authStorage } from './auth-storage';

it('restores player and team scores from REST after a page refresh', async () => {
  authStorage.setTokens('access', null);
  const member = { id: 'p1', nickname: 'Alex', role: 'PLAYER', createdAt: '' };
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) =>
      Promise.resolve(
        url.includes('/csv')
          ? new Response(
              'offerId,roundNumber,amount,proposerId,proposerNickname,responderId,responderNickname,accepted,timestamp\no1,1,30,p1,Alex,p2,Bob,true,now',
            )
          : url.endsWith('/rounds')
            ? new Response(
                JSON.stringify([{ roundNumber: 1, roundPhase: 'ALL_DECISIONS_RECEIVED' }]),
              )
            : new Response(
                JSON.stringify({
                  id: 'game',
                  config: { roundSum: 100 },
                  members: [member, { ...member, id: 'p2', nickname: 'Bob' }],
                  teams: [{ id: 'team', name: 'Team', members: [member] }],
                }),
                { headers: { 'Content-Type': 'application/json' } },
              ),
      ),
    ),
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { result } = renderHook(() => useSessionScore('game'), {
    wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
  });
  await waitFor(() =>
    expect(result.current.data?.players).toEqual([
      { userId: 'p1', nickname: 'Alex', score: 70 },
      { userId: 'p2', nickname: 'Bob', score: 30 },
    ]),
  );
  expect(result.current.data?.teams).toEqual([{ teamId: 'team', name: 'Team', score: 70 }]);
  expect(result.current.data?.roundsCompleted).toBe(1);
});
