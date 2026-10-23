import { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useJoinSession } from '../api/session-queries';
import type { SessionWithTeamsAndMembersResponse, UserResponse } from '../api/types';

export function SessionJoin({
  session,
  user,
}: {
  session: SessionWithTeamsAndMembersResponse;
  user: UserResponse;
}) {
  const teamInputId = useId();
  const join = useJoinSession();
  const navigate = useNavigate();
  const [teamId, setTeamId] = useState('');
  const isMember = session.members.some((m) => m.id === user.id);
  if (session.admin.id === user.id || isMember || session.observers.some((m) => m.id === user.id))
    return (
      <Link className="button" to={`/session/${session.id}`}>
        {isMember ? 'Вернуться в игру' : 'Открыть игру'}
      </Link>
    );
  if (session.state !== 'CREATED' || !session.openToConnect)
    return (
      <p className="notice">
        Вход в эту игру закрыт. Попросите ведущего пригласить вас в следующую.
      </p>
    );
  if (session.members.length >= session.config.numPlayers)
    return <p className="notice">Все места заняты. Выберите другую игру.</p>;
  if (user.role === 'OBSERVER')
    return (
      <p className="notice">
        Ваш профиль предназначен для наблюдения.{' '}
        <Link className="text-link" to={`/session/${session.id}/stats`}>
          Смотреть результаты
        </Link>
      </p>
    );
  const isTeam = session.config.sessionType === 'TEAM_BATTLE';
  const teamLimit = Math.floor(session.config.numPlayers / 2);
  const selectedTeam = session.teams.find((t) => t.id === teamId);
  const teamAvailable = selectedTeam && selectedTeam.members.length < teamLimit;
  return (
    <div className="flex w-full flex-col gap-3">
      {isTeam && (
        <div className="flex flex-col gap-2 text-left">
          <label htmlFor={teamInputId}>Команда</label>
          <select
            id={teamInputId}
            className="rounded-panel border border-brass-500/40 bg-parchment-50 px-3 py-2"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            <option value="">Выберите команду</option>
            {session.teams.map((t) => (
              <option key={t.id} value={t.id} disabled={t.members.length >= teamLimit}>
                {t.name} · {t.members.length} игроков
              </option>
            ))}
          </select>
        </div>
      )}
      <button
        className="button"
        disabled={join.isPending || (isTeam && !teamAvailable)}
        onClick={() =>
          join.mutate(
            { sessionId: session.id, ...(isTeam ? { teamId } : {}) },
            { onSuccess: () => navigate(`/session/${session.id}`) },
          )
        }
      >
        {join.isPending ? 'Подключаемся…' : 'Присоединиться'}
      </button>
      {join.isError && (
        <p role="alert" className="error-message">
          Не удалось присоединиться. Возможно, места уже заняты. Обновите список игр и попробуйте
          снова.
        </p>
      )}
    </div>
  );
}
