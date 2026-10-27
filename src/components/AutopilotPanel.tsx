import { useSetAutopilot } from '../api/session-queries';
import type { SessionWithTeamsAndMembersResponse } from '../api/types';

export function AutopilotPanel({ session }: { session: SessionWithTeamsAndMembersResponse }) {
  const change = useSetAutopilot();
  return (
    <details className="notice">
      <summary className="cursor-pointer font-semibold">Игрок отключился · автопилот</summary>
      <p className="my-3 text-sm">
        Включите автопилот для отсутствующего участника. Он предлагает половину суммы и принимает
        предложения не меньше половины. Уже сделанные ходы сохраняются. После возвращения игрока
        выключите автопилот.
      </p>
      <ul className="flex flex-col gap-3">
        {session.members
          .filter((p) => p.role !== 'NPC')
          .map((p) => {
            const enabled = session.autopilotPlayerIds?.includes(p.id) ?? false;
            return (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {p.nickname}
                  {enabled ? ' · автопилот' : ''}
                </span>
                <button
                  className="button button-secondary"
                  disabled={change.isPending}
                  aria-label={`${enabled ? 'Выключить' : 'Включить'} автопилот: ${p.nickname}`}
                  onClick={() =>
                    change.mutate({ sessionId: session.id, playerId: p.id, enabled: !enabled })
                  }
                >
                  {enabled ? 'Вернуть управление' : 'Включить автопилот'}
                </button>
              </li>
            );
          })}
      </ul>
      {change.isError && (
        <p role="alert" className="mt-3">
          Не удалось изменить автопилот. Обновите игру и повторите.
        </p>
      )}
    </details>
  );
}
