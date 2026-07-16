import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Parchment } from './Parchment';
import { WaxSeal } from './WaxSeal';
import { useJoinSession, useSessionDetails } from '../api/session-queries';
import { ApiError } from '../api/client';
import type { SessionResponse, UserResponse } from '../api/types';

function sessionTypeLabel(type: SessionResponse['config']['sessionType']): string {
  return type === 'TEAM_BATTLE' ? 'Битва команд' : 'Все против всех';
}

type CtaState =
  | { kind: 'own'; href: string }
  | { kind: 'team-unsupported' }
  | { kind: 'full' }
  | { kind: 'join'; onClick: () => void; isPending: boolean; error: string | null };

type Props = {
  session: SessionResponse;
  currentUser: UserResponse | undefined;
};

export function SessionCard({ session, currentUser }: Props) {
  const initial = session.admin.nickname.charAt(0).toUpperCase();
  const total = session.config.numPlayers;
  const isTeam = session.config.sessionType === 'TEAM_BATTLE';
  const isOwn = currentUser !== undefined && session.admin.id === currentUser.id;

  // GET /session (list) не отдаёт membersCount → для FFA `session.teams` пуст и
  // taken всегда 0. Тянем details по каждой карточке — react-query дедуп'ит запрос
  // с полностраничной подпиской в Session.tsx. Кроме того, backend не закрывает
  // openToConnect у полных сессий (BACKEND-FIX-session-list-member-count.md),
  // поэтому «полная» карточка тут и определяется вручную.
  const details = useSessionDetails(session.id);
  const taken = details.data?.members.length ?? 0;
  const isFull = details.data !== undefined && taken >= total;

  const join = useJoinSession();
  const navigate = useNavigate();
  const [localError, setLocalError] = useState<string | null>(null);

  const cta: CtaState = isOwn
    ? { kind: 'own', href: `/session/${session.id}` }
    : isTeam
      ? { kind: 'team-unsupported' }
      : isFull
        ? { kind: 'full' }
        : {
            kind: 'join',
            isPending: join.isPending,
            error: localError,
            onClick: () => {
              setLocalError(null);
              join.mutate(
                { sessionId: session.id },
                {
                  onSuccess: () => navigate(`/session/${session.id}`),
                  onError: (e) => {
                    const msg =
                      e instanceof ApiError
                        ? e.body?.message ?? e.message
                        : 'Стол не отвечает';
                    setLocalError(msg);
                  },
                },
              );
            },
          };

  // Тактильный отклик карточки в лобби: при наведении лёгкий подъём + shadow up.
  // Idle-wobble сознательно не добавляем — в сетке из 8 карт становится тошнотворно.
  return (
    <Parchment className="flex flex-col gap-5 transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_16px_36px_-14px_rgba(60,20,10,0.7)]">
      <div className="flex items-start gap-4">
        <WaxSeal size={56} monogram={initial} />
        <div className="flex flex-col">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-brass-600">
            {sessionTypeLabel(session.config.sessionType)}
          </p>
          <h3 className="font-display text-xl uppercase tracking-[0.16em] text-ink-950">
            {session.displayName}
          </h3>
          <p className="mt-1 font-body text-sm italic text-ink-900/70">
            ведущий · {session.admin.nickname}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-brass-500/40" />
        <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-brass-500">
          Устав партии
        </span>
        <span className="h-px flex-1 bg-brass-500/40" />
      </div>

      <dl className="grid grid-cols-3 gap-3 text-center font-body text-ink-900">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-brass-600">Мест</dt>
          <dd className="mt-1 font-display text-lg">
            {taken}/{total}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-brass-600">Раундов</dt>
          <dd className="mt-1 font-display text-lg">{session.config.numRounds}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-brass-600">Ставка</dt>
          <dd className="mt-1 font-display text-lg">{session.config.roundSum}</dd>
        </div>
      </dl>

      {cta.kind === 'own' && (
        <Link
          to={cta.href}
          className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-6 py-2 text-center font-display text-xs uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px]"
        >
          Перейти к столу
        </Link>
      )}

      {cta.kind === 'team-unsupported' && (
        <button
          type="button"
          disabled
          title="Битвы команд — скоро (T-010+)"
          className="cursor-not-allowed rounded-panel border border-ember-600/30 bg-ember-500/60 px-6 py-2 font-display text-xs uppercase tracking-[0.24em] text-night-950/60"
        >
          Битвы команд — скоро
        </button>
      )}

      {cta.kind === 'full' && (
        <button
          type="button"
          disabled
          title="Все места заняты"
          className="cursor-not-allowed rounded-panel border border-brass-500/40 bg-transparent px-6 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-900/50"
        >
          Мест больше нет
        </button>
      )}

      {cta.kind === 'join' && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={cta.onClick}
            disabled={cta.isPending}
            className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-6 py-2 font-display text-xs uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] disabled:cursor-wait disabled:opacity-60"
          >
            {cta.isPending ? 'занимаем место…' : 'Заявиться в партию'}
          </button>
          {cta.error !== null && (
            <p
              role="alert"
              className="font-body text-xs italic text-blood-600"
            >
              {cta.error}
            </p>
          )}
        </div>
      )}
    </Parchment>
  );
}
