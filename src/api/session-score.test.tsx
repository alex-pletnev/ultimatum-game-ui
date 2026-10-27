import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSessionScore } from './session-queries';
import { authStorage } from './auth-storage';

it('restores player and team scores from REST after a page refresh', async () => {
  authStorage.setTokens('access', null);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          roundSum: 100,
          roundsCompleted: 1,
          players: [
            { userId: 'p1', nickname: 'Alex', score: 70 },
            { userId: 'p2', nickname: 'Bob', score: 30 },
          ],
          teams: [{ teamId: 'team', name: 'Team', score: 70 }],
        }),
        { headers: { 'Content-Type': 'application/json' } },
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
  expect(vi.mocked(fetch).mock.calls[0]![0]).toContain('/statistics/game/score');
});
