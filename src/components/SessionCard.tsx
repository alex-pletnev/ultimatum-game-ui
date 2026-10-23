import { Parchment } from './Parchment';
import { SessionJoin } from './SessionJoin';
import { useSessionDetails } from '../api/session-queries';
import type { SessionResponse, UserResponse } from '../api/types';

export function SessionCard({
  session,
  currentUser,
}: {
  session: SessionResponse;
  currentUser: UserResponse | undefined;
}) {
  const details = useSessionDetails(session.id);
  return (
    <Parchment className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="badge">
          {session.config.sessionType === 'DICTATOR'
            ? 'Диктатор'
            : session.config.sessionType === 'TEAM_BATTLE'
              ? 'Команды'
              : 'Каждый за себя'}
        </span>
        {session.admin.id === currentUser?.id && <span className="badge">Ваша игра</span>}
      </div>
      <div>
        <h2 className="text-2xl font-semibold">{session.displayName}</h2>
        <p className="mt-2 text-sm text-ink-900/70">ведущий · {session.admin.nickname}</p>
      </div>
      <dl className="grid grid-cols-3 gap-3">
        <div>
          <dt className="text-sm text-ink-900/65">Игроки</dt>
          <dd className="font-semibold">
            {details.data ? `${details.data.members.length}/${session.config.numPlayers}` : '…'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-900/65">Раунды</dt>
          <dd className="font-semibold">{session.config.numRounds}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-900/65">Монеты</dt>
          <dd className="font-semibold">{session.config.roundSum}</dd>
        </div>
      </dl>
      <div className="mt-auto">
        {details.data && currentUser ? (
          <SessionJoin session={details.data} user={currentUser} />
        ) : details.isError ? (
          <button className="text-link" onClick={() => void details.refetch()}>
            Не удалось загрузить места. Повторить
          </button>
        ) : (
          <p role="status" className="text-sm">
            Проверяем свободные места…
          </p>
        )}
      </div>
    </Parchment>
  );
}
