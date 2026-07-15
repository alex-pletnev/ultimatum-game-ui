import { Link, Navigate, useParams } from 'react-router';
import { Parchment } from '../components/Parchment';
import { WaxSeal } from '../components/WaxSeal';
import { useAccessToken } from '../api/auth-storage';
import { useCurrentUser } from '../api/auth-queries';
import { useSessionDetails } from '../api/session-queries';
import { useSessionLiveSync } from '../api/ws/useSessionLiveSync';
import type { SessionWithTeamsAndMembersResponse, UserResponse } from '../api/types';

function myRoleAtTable(
  session: SessionWithTeamsAndMembersResponse,
  user: UserResponse,
): 'ведущий' | 'играющий' | 'наблюдатель' | 'зашедший' {
  if (session.admin.id === user.id) return 'ведущий';
  if (session.members.some((m) => m.id === user.id)) return 'играющий';
  if (session.observers.some((o) => o.id === user.id)) return 'наблюдатель';
  return 'зашедший';
}

function MemberRow({ user, sub }: { user: UserResponse; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <WaxSeal size={40} monogram={user.nickname.charAt(0).toUpperCase()} />
      <div className="flex flex-col">
        <span className="font-display text-sm uppercase tracking-[0.12em] text-ink-950">
          {user.nickname}
        </span>
        {sub !== undefined && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-brass-600">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

export function Session() {
  const token = useAccessToken();
  const { id } = useParams<{ id: string }>();
  const { data: user } = useCurrentUser();
  const { data: session, isLoading, isError } = useSessionDetails(id);
  const { connected: liveConnected } = useSessionLiveSync(id);

  if (token === null) return <Navigate to="/" replace />;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16">
        <div
          aria-hidden
          className="h-96 animate-pulse rounded-card bg-parchment-100/40"
          style={{ boxShadow: 'var(--shadow-parchment)' }}
        />
      </div>
    );
  }

  if (isError || session === undefined || user === undefined) {
    return (
      <div className="mx-auto max-w-lg px-8 py-16">
        <Parchment className="text-center">
          <div className="flex flex-col items-center gap-4">
            <WaxSeal size={64} monogram="!" />
            <h1 className="font-display text-xl uppercase tracking-[0.16em] text-blood-500">
              Стол не найден
            </h1>
            <p className="font-body italic text-ink-900/80">
              Партии с таким знаком нет — либо она уже завершилась.
            </p>
            <Link
              to="/lobby"
              className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-900/60 hover:text-ember-700"
            >
              ← в лобби
            </Link>
          </div>
        </Parchment>
      </div>
    );
  }

  const myRole = myRoleAtTable(session, user);
  const playerList = session.members;
  const observerList = session.observers;

  return (
    <div className="mx-auto max-w-3xl px-8 py-16">
      <header className="mb-10 flex items-baseline justify-between border-b border-brass-500/30 pb-6">
        <div>
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-brass-500">
            У стола · роль {myRole}
            <span
              aria-label={liveConnected ? 'подключено к живой ленте' : 'подключение к живой ленте'}
              title={liveConnected ? 'живая лента активна' : 'ждём подключение'}
              className={`inline-block h-2 w-2 rounded-token ${
                liveConnected ? 'bg-verdigris-500' : 'bg-brass-500/40'
              }`}
            />
          </p>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-[0.16em] text-parchment-100">
            {session.displayName}
          </h1>
        </div>
        <Link
          to="/lobby"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-parchment-300/60 hover:text-ember-400"
        >
          ← в лобби
        </Link>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Parchment className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-brass-500/40" />
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-brass-500">
              За столом
            </span>
            <span className="h-px flex-1 bg-brass-500/40" />
          </div>
          <MemberRow user={session.admin} sub="ведущий" />
          {playerList
            .filter((p) => p.id !== session.admin.id)
            .map((p) => (
              <MemberRow key={p.id} user={p} sub="играющий" />
            ))}
          {observerList.map((o) => (
            <MemberRow key={o.id} user={o} sub="наблюдатель" />
          ))}
          {playerList.length === 0 && observerList.length === 0 && (
            <p className="font-body italic text-ink-900/60">
              Пока только ведущий. Ждём остальных.
            </p>
          )}
        </Parchment>

        <Parchment className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-brass-500/40" />
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-brass-500">
              Устав партии
            </span>
            <span className="h-px flex-1 bg-brass-500/40" />
          </div>
          <dl className="grid grid-cols-2 gap-4 text-center font-body text-ink-900">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-brass-600">
                Мест
              </dt>
              <dd className="mt-1 font-display text-lg">
                {playerList.length}/{session.config.numPlayers}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-brass-600">
                Раундов
              </dt>
              <dd className="mt-1 font-display text-lg">{session.config.numRounds}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-brass-600">
                Ставка
              </dt>
              <dd className="mt-1 font-display text-lg">{session.config.roundSum}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-brass-600">
                Тип
              </dt>
              <dd className="mt-1 font-display text-sm">
                {session.config.sessionType === 'TEAM_BATTLE' ? 'команды' : 'все×всех'}
              </dd>
            </div>
          </dl>
        </Parchment>
      </div>

      <Parchment className="mx-auto mt-10 max-w-xl text-center">
        <div className="flex flex-col items-center gap-3">
          <WaxSeal size={56} monogram="§" />
          <h2 className="font-display text-lg uppercase tracking-[0.16em] text-ink-950">
            Стол готов
          </h2>
          <p className="font-body italic text-ink-900/70">
            Ожидаем других играющих — вот-вот начнём. Настоящая игровая механика
            появится в следующих задачах (T-010+).
          </p>
        </div>
      </Parchment>
    </div>
  );
}
