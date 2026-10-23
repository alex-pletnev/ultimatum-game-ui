import { useState } from 'react';
import { Link } from 'react-router';
import { useBulkAttachNpcs, useJoinNpc, useNpcList } from '../api/npc-queries';
import type { NpcStrategy, SessionWithTeamsAndMembersResponse } from '../api/types';
import { NPC_STRATEGIES, defaultNpcParams } from '../api/npc-strategies';

export function AddNpcPanel({ session }: { session: SessionWithTeamsAndMembersResponse }) {
  const list = useNpcList();
  const join = useJoinNpc(session.id);
  const bulk = useBulkAttachNpcs(session.id);
  const [strategy, setStrategy] = useState<NpcStrategy>('FAIR');
  const [npcId, setNpcId] = useState('');
  const [teamId, setTeamId] = useState(session.teams[0]?.id ?? '');
  const teamGame = session.config.sessionType === 'TEAM_BATTLE';
  const capacity =
    teamGame && session.config.numTeams === 2
      ? session.config.numPlayers - (session.config.numPlayers % 2)
      : session.config.numPlayers;
  const slots = capacity - session.members.length;
  const count = Math.min(100, slots);
  const selectedTeam = session.teams.find((t) => t.id === teamId);
  const teamAvailable =
    !teamGame ||
    (selectedTeam && selectedTeam.members.length < Math.floor(session.config.numPlayers / 2));
  const available = (list.data ?? []).filter(
    (n) => !session.members.some((m) => m.id === n.userId),
  );
  if (slots <= 0) return <p className="text-sm">Все места заняты. Можно начинать.</p>;
  return (
    <details className="border-t border-brass-500/25 pt-2">
      <summary>Не хватает игроков? Добавить ботов</summary>
      <div className="mt-3 flex flex-col gap-4 text-left">
        <p className="text-sm text-ink-900/70">
          Боты играют автоматически. Сейчас свободно мест: {slots}.
          {session.config.sessionType === 'TEAM_BATTLE'
            ? ' Боты распределятся по командам автоматически.'
            : ''}
        </p>
        <label className="flex flex-col gap-2">
          Поведение ботов
          <select
            className="rounded-panel border border-brass-500/40 bg-white px-3 py-2"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as NpcStrategy)}
          >
            {NPC_STRATEGIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-ink-900/70">
          {NPC_STRATEGIES.find((s) => s.value === strategy)?.hint}
        </p>
        <button
          className="button button-secondary"
          disabled={bulk.isPending || join.isPending}
          onClick={() => bulk.mutate({ count, strategy, params: defaultNpcParams(strategy) })}
        >
          {bulk.isPending
            ? 'Добавляем ботов…'
            : slots > 100
              ? 'Добавить 100 ботов'
              : 'Заполнить свободные места ботами'}
        </button>
        {bulk.isError && (
          <p role="alert" className="error-message">
            Не удалось добавить ботов. Проверьте свободные места и попробуйте снова.
          </p>
        )}
        <details>
          <summary>Выбрать ранее созданного бота</summary>
          <div className="mt-3 flex flex-col gap-3">
            {list.isLoading && <p role="status">Загружаем ботов…</p>}
            {list.isError && (
              <p role="alert">
                Не удалось загрузить ботов.{' '}
                <button className="text-link" onClick={() => void list.refetch()}>
                  Повторить
                </button>
              </p>
            )}
            {!list.isLoading && !list.isError && !available.length && (
              <p>
                Свободных готовых ботов нет. Можно заполнить места кнопкой выше или{' '}
                <Link className="text-link" to="/npc">
                  создать своего бота
                </Link>
                .
              </p>
            )}
            {available.length > 0 && (
              <>
                <label className="flex flex-col gap-2">
                  Бот
                  <select
                    className="rounded-panel border px-3 py-2"
                    value={npcId}
                    onChange={(e) => setNpcId(e.target.value)}
                  >
                    <option value="">Выберите бота</option>
                    {available.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.nickname}
                      </option>
                    ))}
                  </select>
                </label>
                {session.config.sessionType === 'TEAM_BATTLE' && (
                  <label className="flex flex-col gap-2">
                    Команда
                    <select
                      className="rounded-panel border px-3 py-2"
                      value={teamId}
                      onChange={(e) => setTeamId(e.target.value)}
                    >
                      {session.teams.map((t) => (
                        <option
                          key={t.id}
                          value={t.id}
                          disabled={t.members.length >= Math.floor(session.config.numPlayers / 2)}
                        >
                          {t.name} · {t.members.length} игроков
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <button
                  className="button button-secondary"
                  disabled={!npcId || !teamAvailable || join.isPending || bulk.isPending}
                  onClick={() =>
                    join.mutate(
                      {
                        npcId,
                        teamId: session.config.sessionType === 'TEAM_BATTLE' ? teamId : null,
                      },
                      { onSuccess: () => setNpcId('') },
                    )
                  }
                >
                  Добавить выбранного бота
                </button>
              </>
            )}
            {join.isError && (
              <p role="alert" className="error-message">
                Не удалось добавить бота. Попробуйте другого.
              </p>
            )}
          </div>
        </details>
      </div>
    </details>
  );
}
