import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { Parchment } from '../components/Parchment';
import { WaxSeal } from '../components/WaxSeal';
import { useAccessToken } from '../api/auth-storage';
import { useCurrentUser } from '../api/auth-queries';
import { useCurrentRound, useSessionDetails } from '../api/session-queries';
import { useSessionLiveSync } from '../api/ws/useSessionLiveSync';
import { useStompSend } from '../api/ws/useStompSend';
import type {
  CreateOfferCmd,
  RoundPhase,
  RoundResponse,
  SessionState,
  SessionWithTeamsAndMembersResponse,
  UserResponse,
} from '../api/types';

const sessionStateLabel: Record<SessionState, string> = {
  CREATED: 'Ждём начала',
  RUNNING: 'Партия идёт',
  FINISHED: 'Партия окончена',
  ABORTED: 'Партия прервана',
};

const roundPhaseLabel: Record<RoundPhase, string> = {
  CREATED: 'Раунд подготовлен',
  WAIT_OFFERS: 'Ждём предложений',
  ALL_OFFERS_RECEIVED: 'Тасуем колоду',
  OFFERS_SENT: 'Ждём решений',
  ALL_DECISIONS_RECEIVED: 'Подсчёт очков',
  FINISHED: 'Раунд окончен',
  ABORTED: 'Раунд прерван',
};

function myRoleAtTable(
  session: SessionWithTeamsAndMembersResponse,
  user: UserResponse,
): 'ведущий' | 'играющий' | 'наблюдатель' | 'зашедший' {
  if (session.admin.id === user.id) return 'ведущий';
  if (session.members.some((m) => m.id === user.id)) return 'играющий';
  if (session.observers.some((o) => o.id === user.id)) return 'наблюдатель';
  return 'зашедший';
}

/**
 * Панель WAIT_OFFERS: если player ещё не сделал оффер — слайдер + submit;
 * если сделал — waiting-текст с progress по остальным.
 * Показывается только когда myRole !== NONE (admin-observer не участвует).
 */
function OfferPhasePanel({
  sessionId,
  round,
  roundSum,
  playersCount,
  liveConnected,
}: {
  sessionId: string;
  round: RoundResponse;
  roundSum: number;
  playersCount: number;
  liveConnected: boolean;
}) {
  const stompSend = useStompSend();
  const [amount, setAmount] = useState<number>(Math.floor(roundSum / 2));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsToSendOffer = round.myPendingActions.some((a) => a.type === 'SEND_OFFER');

  if (!needsToSendOffer) {
    return (
      <>
        <p className="font-body italic text-ink-900/80">
          Твоё предложение занесено в книгу.
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600">
          Собрано {round.offers.length} / {playersCount}
        </p>
      </>
    );
  }

  const submit = () => {
    setError(null);
    setSending(true);
    try {
      const body: CreateOfferCmd = { amount };
      stompSend(`/app/session/${sessionId}/offer.create`, body);
      // Ставим оптимистический lock до invalidate'а; успешный broadcast снимет
      // SEND_OFFER из myPendingActions и переключит панель на waiting-режим.
    } catch (e) {
      setSending(false);
      setError(e instanceof Error ? e.message : 'Не удалось отправить предложение');
    }
  };

  const disabled = !liveConnected || sending;

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <p className="font-body text-base italic text-ink-900/80">
        Раздели ставку {roundSum}: сколько монет предложить второй стороне?
      </p>
      <div className="flex flex-col items-center gap-2">
        <span className="font-display text-3xl text-ink-950">{amount}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600">
          из {roundSum} · тебе останется {roundSum - amount}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={roundSum}
        step={1}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        disabled={disabled}
        aria-label="Сумма предложения"
        className="w-full accent-ember-500 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled}
        className="rounded-panel border border-ember-600/40 bg-ember-500 px-6 py-2 font-display text-sm uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
        title={liveConnected ? '' : 'ждём подключение к живой ленте'}
      >
        {sending ? 'Отправляем…' : 'Огласить сделку'}
      </button>
      {error !== null && (
        <p role="alert" className="font-body text-sm italic text-blood-600">
          {error}
        </p>
      )}
    </div>
  );
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
  const stompSend = useStompSend();
  const [sendError, setSendError] = useState<string | null>(null);

  const isRunning = session?.state === 'RUNNING';
  const { data: round } = useCurrentRound(id, isRunning);

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

      <Parchment className="mx-auto mt-10 max-w-2xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-brass-600">
            {sessionStateLabel[session.state]}
          </p>

          {session.state === 'RUNNING' && round !== undefined && (
            <>
              <h2 className="font-display text-2xl uppercase tracking-[0.16em] text-ink-950">
                Раунд {round.roundNumber} / {session.config.numRounds}
              </h2>
              <span className="h-px w-16 bg-brass-500/60" />
              <p className="font-body text-lg italic text-ink-900/80">
                {roundPhaseLabel[round.roundPhase]}
              </p>
              {round.myRole !== 'NONE' && (
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-brass-600">
                  Твоя роль в раунде: {round.myRole === 'BOTH' ? 'proposer + responder' : round.myRole.toLowerCase()}
                </p>
              )}
              {round.roundPhase === 'WAIT_OFFERS' && round.myRole !== 'NONE' && (
                <>
                  <span className="h-px w-16 bg-brass-500/60" />
                  <OfferPhasePanel
                    sessionId={session.id}
                    round={round}
                    roundSum={session.config.roundSum}
                    playersCount={playerList.length}
                    liveConnected={liveConnected}
                  />
                </>
              )}
            </>
          )}

          {session.state === 'CREATED' && myRole === 'ведущий' && (
            <>
              <h2 className="font-display text-xl uppercase tracking-[0.16em] text-ink-950">
                Стол готов
              </h2>
              <p className="font-body italic text-ink-900/70">
                Как только все займут места — можно объявлять начало.
              </p>
              <button
                type="button"
                disabled={!liveConnected}
                onClick={() => {
                  try {
                    setSendError(null);
                    stompSend(`/app/session/${session.id}/start`);
                  } catch (e) {
                    setSendError(
                      e instanceof Error ? e.message : 'Не удалось отправить команду',
                    );
                  }
                }}
                className="rounded-panel border border-ember-600/40 bg-ember-500 px-8 py-3 font-display text-sm uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                title={liveConnected ? '' : 'ждём подключение к живой ленте'}
              >
                Начать партию
              </button>
              {sendError !== null && (
                <p role="alert" className="font-body text-sm italic text-blood-600">
                  {sendError}
                </p>
              )}
            </>
          )}

          {session.state === 'CREATED' && myRole !== 'ведущий' && (
            <p className="font-body italic text-ink-900/70">
              Ведущий вот-вот объявит начало партии.
            </p>
          )}

          {(session.state === 'FINISHED' || session.state === 'ABORTED') && (
            <p className="font-body italic text-ink-900/70">
              {session.state === 'FINISHED'
                ? 'Партия сыграна. Итоги — на табло очков (когда появится, T-014+).'
                : 'Партию пришлось прервать раньше срока.'}
            </p>
          )}
        </div>
      </Parchment>
    </div>
  );
}
