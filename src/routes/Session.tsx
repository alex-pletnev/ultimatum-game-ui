import { useEffect, useState } from 'react';
import { Link, Navigate, useHref, useParams, useNavigate } from 'react-router';
import { AddNpcPanel } from '../components/AddNpcPanel';
import { Parchment } from '../components/Parchment';
import { SessionJoin } from '../components/SessionJoin';
import { rememberGame } from '../api/recent-game';
import { useAccessToken } from '../api/auth-storage';
import { useCurrentUser } from '../api/auth-queries';
import {
  useCurrentRound,
  useSessionDetails,
  useSessionScore,
  useRematch,
} from '../api/session-queries';
import { useSessionLiveSync } from '../api/ws/useSessionLiveSync';
import { useGameCommand } from '../api/ws/useGameCommand';
import type {
  RoundResponse,
  SessionScoreDto,
  SessionWithTeamsAndMembersResponse,
} from '../api/types';

function CommandFeedback({ error }: { error: string | null }) {
  return error ? (
    <div role="alert" className="error-message">
      <p>{error}</p>
      <button className="text-link mt-2" onClick={() => window.location.reload()}>
        Обновить игру
      </button>
    </div>
  ) : null;
}

type PhaseProps = {
  sessionId: string;
  round: RoundResponse;
  roundSum: number;
  playersCount: number;
  liveConnected: boolean;
  dictator?: boolean;
};

export function OfferPhasePanel({
  sessionId,
  round,
  roundSum,
  playersCount,
  liveConnected,
  dictator = false,
}: PhaseProps) {
  const command = useGameCommand(`${round.id}:offer`);
  const [amount, setAmount] = useState(Math.floor(roundSum / 2));
  if (!round.myPendingActions.some((a) => a.type === 'SEND_OFFER'))
    return (
      <div role="status">
        <h3 className="text-xl font-semibold">Предложение отправлено</h3>
        <p className="mt-2">
          Ждём остальных. Собрано {round.offers.length} / {playersCount}
        </p>
      </div>
    );
  const disabled = !liveConnected || command.pending;
  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <h3 className="text-2xl font-semibold">Сколько предложите другому игроку?</h3>
        <p className="mt-2 text-ink-900/70">
          Разделите {roundSum} монет.{' '}
          {dictator
            ? 'В режиме «Диктатор» другой игрок автоматически получит предложенную долю — отказаться нельзя.'
            : 'Если предложение отклонят, оба получите 0 за эту сделку.'}
        </p>
      </div>
      <div className="split-preview">
        <div>
          Вам остаётся<strong>{roundSum - amount}</strong>
        </div>
        <div>
          Другому игроку<strong>{amount}</strong>
        </div>
      </div>
      <label className="flex flex-col gap-2">
        Сумма предложения
        <input
          type="range"
          min={0}
          max={roundSum}
          step={1}
          value={amount}
          disabled={disabled}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {[0.25, 0.5, 0.75].map((share) => (
          <button
            key={share}
            className="button button-secondary flex-1"
            disabled={disabled}
            onClick={() => setAmount(Math.floor(roundSum * share))}
          >
            {Math.floor(roundSum * share)} монет
          </button>
        ))}
      </div>
      <button
        className="button"
        disabled={disabled}
        onClick={() => command.send(`/app/session/${sessionId}/offer.create`, { amount })}
      >
        {command.pending ? 'Отправляем…' : `Предложить ${amount} монет`}
      </button>
      <p className="text-sm text-ink-900/65">После отправки предложение нельзя изменить.</p>
      <CommandFeedback error={command.error} />
    </div>
  );
}

export function DecisionPhasePanel({
  sessionId,
  round,
  roundSum,
  playersCount,
  liveConnected,
}: PhaseProps) {
  const command = useGameCommand(`${round.id}:decision`);
  const action = round.myPendingActions.find((a) => a.type === 'MAKE_DECISION');
  if (!action?.offerId)
    return (
      <div role="status">
        <h3 className="text-xl font-semibold">Ответ отправлен</h3>
        <p className="mt-2">
          Ждём остальных. Решено {round.decisions.length} / {playersCount}
        </p>
      </div>
    );
  const offer = round.offers.find((o) => o.id === action.offerId);
  if (!offer) return <p role="status">Загружаем предложение…</p>;
  const disabled = !liveConnected || command.pending;
  return (
    <div className="flex w-full flex-col gap-5">
      <h3 className="text-2xl font-semibold">{offer.proposer.nickname} предлагает раздел</h3>
      <div className="split-preview">
        <div>
          Вы получите<strong data-testid="assigned-offer-amount">{offer.offerValue}</strong>
        </div>
        <div>
          Другой игрок получит<strong>{roundSum - offer.offerValue}</strong>
        </div>
      </div>
      <p>
        Примете — каждый получит свою долю. Откажетесь — оба получите 0 за эту сделку. Решение
        нельзя отменить.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          className="button"
          disabled={disabled}
          onClick={() =>
            command.send(`/app/session/${sessionId}/make.decision`, {
              offerId: offer.id,
              decision: true,
            })
          }
        >
          Принять · получить {offer.offerValue}
        </button>
        <button
          className="button button-secondary"
          disabled={disabled}
          onClick={() =>
            command.send(`/app/session/${sessionId}/make.decision`, {
              offerId: offer.id,
              decision: false,
            })
          }
        >
          Отклонить · обоим 0
        </button>
      </div>
      {command.pending && <p role="status">Отправляем решение…</p>}
      <CommandFeedback error={command.error} />
    </div>
  );
}

export function AbortRoundButton({
  sessionId,
  liveConnected,
}: {
  sessionId: string;
  liveConnected: boolean;
  dictator?: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const command = useGameCommand(`${sessionId}:abort`);
  return (
    <div className="mt-6 border-t border-brass-500/20 pt-4">
      {!confirm ? (
        <button className="text-link text-sm" onClick={() => setConfirm(true)}>
          Прервать раунд
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <p>
            Прервать текущий раунд? Игроки больше не смогут отправить предложения и ответы в нём.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="button button-secondary"
              onClick={() => setConfirm(false)}
              disabled={command.pending}
            >
              Продолжить раунд
            </button>
            <button
              className="button"
              disabled={!liveConnected || command.pending}
              onClick={() => command.send(`/app/session/${sessionId}/round.abort`)}
            >
              Да, прервать
            </button>
          </div>
        </div>
      )}
      <CommandFeedback error={command.error} />
    </div>
  );
}

export function RoundResultPanel({
  sessionId,
  score,
  currentUserId,
  isAdmin,
  isSessionRunning,
  isLastRound,
  liveConnected,
}: {
  sessionId: string;
  score: SessionScoreDto | undefined;
  currentUserId: string;
  isAdmin: boolean;
  isSessionRunning: boolean;
  isLastRound: boolean;
  liveConnected: boolean;
  dictator?: boolean;
}) {
  const command = useGameCommand(`${sessionId}:${score?.roundsCompleted}:next`);
  return (
    <div className="flex w-full flex-col gap-5">
      <h3 className="text-xl font-semibold">Общий счёт</h3>
      {!score ? (
        <p role="status">Считаем очки…</p>
      ) : (
        <>
          <p className="text-sm text-ink-900/70">Сыграно раундов: {score.roundsCompleted}</p>
          <ol aria-label="Счёт игроков" className="divide-y divide-brass-500/20">
            {[...score.players]
              .sort((a, b) => b.score - a.score)
              .map((p, i) => (
                <li key={p.userId} className="flex items-center justify-between gap-4 py-3">
                  <span className="min-w-0 break-words">
                    {i + 1}. {p.nickname}
                    {p.userId === currentUserId ? ' · ты' : ''}
                  </span>
                  <strong className="shrink-0 text-xl">{p.score}</strong>
                </li>
              ))}
          </ol>
          {score.teams.length > 0 && (
            <div className="notice">
              <h4 className="mb-2 font-semibold">Командный счёт</h4>
              {score.teams.map((t) => (
                <p key={t.teamId} className="flex justify-between gap-3">
                  <span>{t.name}</span>
                  <strong>{t.score}</strong>
                </p>
              ))}
            </div>
          )}
        </>
      )}
      {isAdmin && isSessionRunning && (
        <button
          className="button"
          disabled={!liveConnected || command.pending}
          onClick={() => command.send(`/app/session/${sessionId}/round.start`)}
        >
          {command.pending ? 'Продолжаем…' : isLastRound ? 'Завершить партию' : 'Следующий раунд'}
        </button>
      )}
      {!isAdmin && isSessionRunning && (
        <p className="text-sm text-ink-900/70">
          Ведущий начнёт следующий раунд. Можно пока обсудить результаты.
        </p>
      )}
      <CommandFeedback error={command.error} />
    </div>
  );
}

function Invite({ id }: { id: string }) {
  const href = useHref(`/session/${id}`);
  const url = new URL(href, window.location.href).href;
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  return (
    <div className="notice flex flex-col gap-3">
      <label htmlFor="invitation" className="font-semibold">
        Пригласите друзей
      </label>
      <p className="text-sm">Отправьте ссылку. Друзья введут имя и присоединятся к этой игре.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="invitation"
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 rounded-inset border border-brass-500/40 bg-white px-3 text-sm"
        />
        <button
          className="button button-secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setCopyError(false);
            } catch {
              setCopyError(true);
            }
          }}
        >
          {copied ? 'Скопировано' : 'Копировать ссылку'}
        </button>
      </div>
      {copyError && (
        <p role="status" className="text-sm">
          Не удалось скопировать автоматически. Выделите ссылку выше и скопируйте её.
        </p>
      )}
    </div>
  );
}

function readiness(session: SessionWithTeamsAndMembersResponse): string | null {
  if (session.members.length < 2)
    return 'Для начала нужны хотя бы два игрока. Пригласите друзей или добавьте ботов.';
  if (session.config.sessionType === 'TEAM_BATTLE') {
    const largest = Math.max(...session.teams.map((t) => t.members.length), 0);
    if (largest > session.members.length / 2)
      return 'Распределите игроков по командам поровну, чтобы каждый получил предложение соперника.';
  }
  return null;
}

export function Session() {
  const navigate = useNavigate();
  const rematch = useRematch();
  const token = useAccessToken();
  const { id } = useParams<{ id: string }>();
  const profile = useCurrentUser();
  const details = useSessionDetails(id);
  const session = details.data;
  const user = profile.data;
  const { connected } = useSessionLiveSync(token ? id : undefined);
  const current = useCurrentRound(id, session?.state === 'RUNNING');
  const round = current.data;
  const score = useSessionScore(id);
  const start = useGameCommand(`${id}:${session?.state}`);
  useEffect(() => {
    if (
      session &&
      user &&
      (session.admin.id === user.id || session.members.some((m) => m.id === user.id))
    ) {
      rememberGame(user.id, {
        id: session.id,
        name: session.displayName,
        finished: session.state === 'FINISHED' || session.state === 'ABORTED',
      });
    }
  }, [session, user]);

  if (!token)
    return <Navigate to={`/register?next=${encodeURIComponent(`/session/${id ?? ''}`)}`} replace />;
  if (details.isLoading || profile.isLoading)
    return (
      <p role="status" className="page-container py-12">
        Загружаем игру…
      </p>
    );
  if (!session || !user)
    return (
      <main className="page-container max-w-xl py-10">
        <Parchment>
          <h1 className="text-2xl font-semibold">Не удалось открыть игру</h1>
          <p className="my-4">Проверьте ссылку и подключение к интернету.</p>
          <button
            className="button"
            onClick={() => {
              void details.refetch();
              void profile.refetch();
            }}
          >
            Повторить
          </button>
          <Link className="text-link ml-4" to="/lobby">
            К играм
          </Link>
        </Parchment>
      </main>
    );
  const isAdmin = session.admin.id === user.id;
  const isPlayer = session.members.some((p) => p.id === user.id);
  const isObserver = session.observers.some((p) => p.id === user.id);
  const hasJoined = isAdmin || isPlayer || isObserver;
  const readyError = readiness(session);
  const finishedRound =
    round && ['FINISHED', 'ALL_DECISIONS_RECEIVED', 'ABORTED'].includes(round.roundPhase);
  return (
    <main className="page-container max-w-4xl py-8">
      <header className="mb-6">
        <Link className="text-link text-sm" to="/lobby">
          ← Все игры
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold">{session.displayName}</h1>
          <span className="badge">
            {isAdmin
              ? isPlayer
                ? 'Вы играете и ведёте'
                : 'Вы — ведущий'
              : isPlayer
                ? 'Вы — игрок'
                : 'Приглашение'}
          </span>
        </div>
      </header>
      {!connected && hasJoined && (
        <p className="notice mb-5" role="status">
          Восстанавливаем соединение… Действия станут доступны автоматически. Не закрывайте
          страницу.
        </p>
      )}
      <Parchment className="flex flex-col gap-6">
        {!hasJoined ? (
          <>
            <h2 className="text-2xl font-semibold">Присоединиться к игре</h2>
            <p>
              Ведущий: {session.admin.nickname}. Игроков: {session.members.length}/
              {session.config.numPlayers}. {session.config.numRounds} раунда,{' '}
              {session.config.roundSum} монет на сделку.
            </p>
            <SessionJoin session={session} user={user} />
          </>
        ) : (
          <>
            {session.state === 'CREATED' && (
              <>
                <h2 className="text-2xl font-semibold">
                  {isAdmin ? 'Пригласите игроков и начните' : 'Вы в игре. Ждём начала'}
                </h2>
                <p>
                  {session.members.length} из {session.config.numPlayers} мест занято.{' '}
                  {isAdmin
                    ? 'Можно начать, когда соберутся хотя бы двое.'
                    : `Ведущий ${session.admin.nickname} начнёт раунд. Страница обновится автоматически.`}
                </p>
                <Invite id={session.id} />
                {isAdmin && (
                  <>
                    {readyError && <p className="text-sm text-ink-900/70">{readyError}</p>}
                    <button
                      className="button"
                      disabled={!connected || Boolean(readyError) || start.pending}
                      onClick={() => start.send(`/app/session/${session.id}/start`)}
                    >
                      {start.pending ? 'Начинаем…' : 'Начать игру'}
                    </button>
                    <CommandFeedback error={start.error} />
                    <AddNpcPanel session={session} />
                  </>
                )}
              </>
            )}
            {session.state === 'RUNNING' && (
              <>
                {current.isError ? (
                  <p role="alert">
                    Не удалось загрузить раунд.{' '}
                    <button className="text-link" onClick={() => void current.refetch()}>
                      Повторить
                    </button>
                  </p>
                ) : !round ? (
                  <p role="status">Загружаем раунд…</p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xl font-semibold">
                        Раунд {round.roundNumber} / {session.config.numRounds}
                      </h2>
                      <span className="badge">
                        {finishedRound
                          ? 'Результаты'
                          : round.roundPhase === 'OFFERS_SENT'
                            ? 'Ответы'
                            : 'Предложения'}
                      </span>
                    </div>
                    <ol className="flex flex-wrap gap-2 text-sm" aria-label="Ход раунда">
                      <li
                        className="badge"
                        aria-current={round.roundPhase === 'WAIT_OFFERS' ? 'step' : undefined}
                      >
                        1. Предложения
                      </li>
                      <li
                        className="badge"
                        aria-current={round.roundPhase === 'OFFERS_SENT' ? 'step' : undefined}
                      >
                        {session.config.sessionType === 'DICTATOR'
                          ? '2. Автоматический раздел'
                          : '2. Ответы'}
                      </li>
                      <li className="badge" aria-current={finishedRound ? 'step' : undefined}>
                        3. Результаты
                      </li>
                    </ol>
                    {isPlayer && ['CREATED', 'ALL_OFFERS_RECEIVED'].includes(round.roundPhase) && (
                      <p role="status">
                        Распределяем предложения. Ваш следующий ход появится автоматически.
                      </p>
                    )}
                    {isPlayer && round.roundPhase === 'WAIT_OFFERS' && (
                      <OfferPhasePanel
                        dictator={session.config.sessionType === 'DICTATOR'}
                        key={`${round.id}:offer`}
                        sessionId={session.id}
                        round={round}
                        roundSum={session.config.roundSum}
                        playersCount={session.members.length}
                        liveConnected={connected}
                      />
                    )}
                    {isPlayer && round.roundPhase === 'OFFERS_SENT' && (
                      <DecisionPhasePanel
                        key={`${round.id}:decision`}
                        sessionId={session.id}
                        round={round}
                        roundSum={session.config.roundSum}
                        playersCount={session.members.length}
                        liveConnected={connected}
                      />
                    )}
                    {!isPlayer && !finishedRound && (
                      <div role="status" className="notice">
                        <h3 className="font-semibold">
                          {round.roundPhase === 'OFFERS_SENT'
                            ? 'Игроки принимают решения'
                            : 'Игроки делают предложения'}
                        </h3>
                        <p className="mt-2">
                          Предложений: {round.offers.length}/{session.members.length} · Ответов:{' '}
                          {round.decisions.length}/{session.members.length}
                        </p>
                        <p className="mt-2 text-sm">
                          Когда все ответят, здесь появятся результаты.
                        </p>
                      </div>
                    )}
                    {finishedRound && (
                      <>
                        {round.roundPhase === 'ABORTED' && (
                          <p className="notice">Раунд прерван ведущим.</p>
                        )}
                        {score.isError && (
                          <p role="alert">
                            Не удалось загрузить счёт.{' '}
                            <button className="text-link" onClick={() => void score.refetch()}>
                              Повторить
                            </button>
                          </p>
                        )}
                        <RoundResultPanel
                          key={round.id}
                          sessionId={session.id}
                          score={score.data}
                          currentUserId={user.id}
                          isAdmin={
                            isAdmin &&
                            (!session.config.autoAdvanceRounds ||
                              round.roundPhase === 'ABORTED' ||
                              round.roundNumber >= session.config.numRounds)
                          }
                          isSessionRunning
                          isLastRound={round.roundNumber >= session.config.numRounds}
                          liveConnected={connected}
                        />
                      </>
                    )}
                    {isAdmin && !finishedRound && (
                      <AbortRoundButton
                        key={round.id}
                        sessionId={session.id}
                        liveConnected={connected}
                      />
                    )}
                  </>
                )}
              </>
            )}
            {session.state === 'FINISHED' && (
              <>
                <h2 className="text-2xl font-semibold">Игра завершена</h2>
                <>
                  {score.isError && (
                    <p role="alert">
                      Не удалось загрузить счёт.{' '}
                      <button className="text-link" onClick={() => void score.refetch()}>
                        Повторить
                      </button>
                    </p>
                  )}
                  <RoundResultPanel
                    sessionId={session.id}
                    score={score.data}
                    currentUserId={user.id}
                    isAdmin={isAdmin}
                    isSessionRunning={false}
                    isLastRound
                    liveConnected={connected}
                  />
                </>
                <Link className="button" to={`/session/${session.id}/stats`}>
                  Посмотреть результаты
                </Link>
                {isAdmin && (
                  <>
                    <button
                      className="button button-secondary"
                      disabled={rematch.isPending}
                      onClick={() =>
                        rematch.mutate(session.id, {
                          onSuccess: (game) => navigate(`/session/${game.id}`),
                        })
                      }
                    >
                      {rematch.isPending ? 'Создаём реванш…' : 'Реванш с теми же настройками'}
                    </button>
                    <p className="text-sm">
                      Новая партия и новая ссылка. Пригласите друзей или добавьте ботов заново.
                    </p>
                    {rematch.isError && (
                      <p role="alert" className="error-message">
                        Не удалось создать реванш. Попробуйте ещё раз.
                      </p>
                    )}
                  </>
                )}
                <Link className="text-link" to={isAdmin ? '/lobby/new' : '/lobby'}>
                  {isAdmin ? 'Создать ещё одну игру' : 'Найти следующую игру'}
                </Link>
              </>
            )}
            {session.state === 'ABORTED' && (
              <>
                <h2 className="text-2xl font-semibold">Игра прервана</h2>
                <p>Ведущий завершил игру раньше времени.</p>
                <Link className="button" to="/lobby">
                  К другим играм
                </Link>
              </>
            )}
          </>
        )}
      </Parchment>
      <details
        className="mt-6 rounded-card border border-brass-500/25 bg-white p-5"
        open={session.state === 'CREATED'}
      >
        <summary>Участники и настройки · {session.members.length} игроков</summary>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 font-semibold">Участники</h2>
            <p className="mb-2 text-sm">Ведущий: {session.admin.nickname}</p>
            <ul className="space-y-2">
              {session.members.map((p) => (
                <li key={p.id} className="break-words">
                  {p.nickname}
                  {p.id === user.id ? ' · вы' : ''}
                  {p.role === 'NPC' ? ' · бот' : ''}
                  {session.config.sessionType === 'TEAM_BATTLE' &&
                    ` · ${session.teams.find((t) => t.members.some((m) => m.id === p.id))?.name ?? ''}`}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 font-semibold">Настройки</h2>
            <p>
              {session.config.numRounds} раунда · {session.config.roundSum} монет
            </p>
            <p>
              {session.config.sessionType === 'DICTATOR'
                ? 'Диктатор · без права отказа'
                : session.config.sessionType === 'TEAM_BATTLE'
                  ? 'Командная игра'
                  : 'Каждый за себя'}
            </p>
            <Link className="text-link mt-3 inline-block" to="/rules">
              Напомнить правила
            </Link>
            {session.state !== 'CREATED' && (
              <Link className="text-link mt-3 block" to={`/session/${session.id}/stats`}>
                Подробная статистика
              </Link>
            )}
          </div>
        </div>
      </details>
    </main>
  );
}
