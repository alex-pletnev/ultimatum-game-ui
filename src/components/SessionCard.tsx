import { Parchment } from './Parchment';
import { WaxSeal } from './WaxSeal';
import type { SessionResponse } from '../api/types';

/*
 * «Афиша партии» — пергаментная карточка сессии в лобби.
 * Монограмма ведущего · displayName · тип · места · раунды · disabled CTA.
 */

function sessionTypeLabel(type: SessionResponse['config']['sessionType']): string {
  return type === 'TEAM_BATTLE' ? 'Битва команд' : 'Все против всех';
}

function currentSeatsTaken(session: SessionResponse): number {
  // Backend в SessionResponse не отдаёт members напрямую (только TeamPrew.size).
  // Для FFA считаем через размер команд (в FFA — одна фиктивная команда) либо 0,
  // если teams пусты. С '/with-teams-and-members' точнее, но здесь — обзор.
  return session.teams.reduce((sum, t) => sum + t.size, 0);
}

type Props = {
  session: SessionResponse;
};

export function SessionCard({ session }: Props) {
  const initial = session.admin.nickname.charAt(0).toUpperCase();
  const taken = currentSeatsTaken(session);
  const total = session.config.numPlayers;

  return (
    <Parchment className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
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

      <button
        type="button"
        disabled
        title="Скоро — присоединение к партии (T-008)"
        className="cursor-not-allowed rounded-panel border border-ember-600/30 bg-ember-500/60 px-6 py-2 font-display text-xs uppercase tracking-[0.24em] text-night-950/60"
      >
        Заявиться в партию
      </button>
    </Parchment>
  );
}
