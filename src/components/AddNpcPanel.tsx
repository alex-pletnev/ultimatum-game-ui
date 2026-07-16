import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useBulkAttachNpcs, useJoinNpc, useNpcList } from '../api/npc-queries';
import { ApiError } from '../api/client';
import type {
  NpcParams,
  NpcStrategy,
  SessionWithTeamsAndMembersResponse,
} from '../api/types';

const STRATEGIES: NpcStrategy[] = ['FAIR', 'SELFISH', 'RANDOM', 'VENGEFUL', 'ADAPTIVE'];

function defaultParams(strategy: NpcStrategy): NpcParams {
  switch (strategy) {
    case 'FAIR':
      return { type: 'FAIR', fairnessThreshold: 0.3 };
    case 'SELFISH':
      return { type: 'SELFISH', minOffer: 0 };
    case 'RANDOM':
      return { type: 'RANDOM', acceptProbability: 0.5 };
    case 'VENGEFUL':
      return { type: 'VENGEFUL', baselineFraction: 0.5, punishStep: 1, fairnessThreshold: 0.3 };
    case 'ADAPTIVE':
      return { type: 'ADAPTIVE', baselineFraction: 0.5, targetRejectRate: 0.2, slope: 0.5 };
  }
}

function apiErrorMessage(err: unknown): string | null {
  if (err === null || err === undefined) return null;
  if (err instanceof ApiError) return err.body?.message ?? err.message;
  return 'Не удалось выполнить';
}

/**
 * Панель «Позвать бота» — показывается ведущему, пока сессия в CREATED.
 * Два режима: приаттачить готового NPC / наковать N новых bulk-ом.
 * Успех = queryClient обновит details, живая лента и так поймает sessionStatus.
 */
export function AddNpcPanel({
  session,
}: {
  session: SessionWithTeamsAndMembersResponse;
}) {
  const npcList = useNpcList();
  const join = useJoinNpc(session.id);
  const bulk = useBulkAttachNpcs(session.id);

  const [mode, setMode] = useState<'existing' | 'bulk'>('existing');
  const [selectedNpcId, setSelectedNpcId] = useState('');
  const [teamId, setTeamId] = useState<string>(
    session.teams[0]?.id ?? '',
  );
  const [bulkCount, setBulkCount] = useState(2);
  const [bulkStrategy, setBulkStrategy] = useState<NpcStrategy>('FAIR');
  const [bulkParams, setBulkParams] = useState<NpcParams>(defaultParams('FAIR'));
  const [seedBaseText, setSeedBaseText] = useState('');

  const slotsLeft = session.config.numPlayers - session.members.length;
  const isTeamBattle = session.config.sessionType === 'TEAM_BATTLE';

  const availableNpcs = useMemo(() => {
    const attachedIds = new Set(session.members.map((m) => m.id));
    return (npcList.data ?? []).filter((n) => !attachedIds.has(n.userId));
  }, [npcList.data, session.members]);

  const handleStrategy = (s: NpcStrategy) => {
    setBulkStrategy(s);
    setBulkParams(defaultParams(s));
  };

  const submitExisting = () => {
    if (selectedNpcId.length === 0) return;
    join.mutate(
      {
        npcId: selectedNpcId,
        teamId: isTeamBattle ? teamId : null,
      },
      { onSuccess: () => setSelectedNpcId('') },
    );
  };

  const submitBulk = () => {
    const seedBase = seedBaseText.trim().length > 0 ? Number(seedBaseText) : null;
    bulk.mutate({
      count: bulkCount,
      strategy: bulkStrategy,
      params: bulkParams,
      seedBase,
    });
  };

  const joinErr = apiErrorMessage(join.error);
  const bulkErr = apiErrorMessage(bulk.error);

  if (slotsLeft <= 0) {
    return (
      <p className="font-body text-sm italic text-ink-900/60">
        За столом мест больше нет.
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 border-t border-brass-500/30 pt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-brass-500">
            Позвать бота
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600">
            · свободно {slotsLeft}
          </span>
        </div>
        <Link
          to="/npc"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-900/50 hover:text-ember-700"
        >
          → в отряд
        </Link>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('existing')}
          className={`flex-1 rounded-panel border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.3em] transition ${
            mode === 'existing'
              ? 'border-ember-600 bg-parchment-200/60 text-ink-950'
              : 'border-brass-500/30 text-ink-900/60 hover:border-brass-500'
          }`}
        >
          готовый
        </button>
        <button
          type="button"
          onClick={() => setMode('bulk')}
          className={`flex-1 rounded-panel border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.3em] transition ${
            mode === 'bulk'
              ? 'border-ember-600 bg-parchment-200/60 text-ink-950'
              : 'border-brass-500/30 text-ink-900/60 hover:border-brass-500'
          }`}
        >
          наковать разом
        </button>
      </div>

      {mode === 'existing' && (
        <div className="flex flex-col gap-3 text-left">
          {npcList.isLoading && (
            <p className="font-body italic text-ink-900/60">Смотрим отряд…</p>
          )}
          {!npcList.isLoading && availableNpcs.length === 0 && (
            <p className="font-body italic text-ink-900/60">
              Все готовые уже за столом. Выкуй нового в{' '}
              <Link to="/npc" className="text-ember-700 underline">
                отряде
              </Link>
              .
            </p>
          )}
          {availableNpcs.length > 0 && (
            <>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600">
                  Бот
                </span>
                <select
                  value={selectedNpcId}
                  onChange={(e) => setSelectedNpcId(e.target.value)}
                  className="rounded-inset border border-brass-500/40 bg-parchment-200/50 px-3 py-2 font-body text-base text-ink-950 outline-none focus:border-ember-600"
                >
                  <option value="">— выбрать —</option>
                  {availableNpcs.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.nickname} · {n.strategy}
                    </option>
                  ))}
                </select>
              </label>

              {isTeamBattle && (
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600">
                    Команда
                  </span>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="rounded-inset border border-brass-500/40 bg-parchment-200/50 px-3 py-2 font-body text-base text-ink-950 outline-none focus:border-ember-600"
                  >
                    {session.teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.members.length})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <button
                type="button"
                onClick={submitExisting}
                disabled={selectedNpcId.length === 0 || join.isPending}
                className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-4 py-2 font-display text-sm uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {join.isPending ? 'сажаем…' : 'Позвать'}
              </button>
              {joinErr !== null && (
                <p role="alert" className="font-body text-xs italic text-blood-600">
                  {joinErr}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {mode === 'bulk' && (
        <div className="flex flex-col gap-3 text-left">
          {isTeamBattle && (
            <p className="rounded-inset border border-brass-500/40 bg-parchment-200/40 px-3 py-2 font-body text-xs italic text-ink-900/70">
              Bulk пока не раскидывает NPC по командам — в TEAM_BATTLE зови по одному.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600">
                Сколько
              </span>
              <input
                type="number"
                min={1}
                max={slotsLeft}
                value={bulkCount}
                onChange={(e) => setBulkCount(Number(e.target.value))}
                className="rounded-inset border border-brass-500/40 bg-parchment-200/50 px-3 py-2 font-body text-base text-ink-950 outline-none focus:border-ember-600"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600">
                Seed base
              </span>
              <input
                type="number"
                value={seedBaseText}
                onChange={(e) => setSeedBaseText(e.target.value)}
                placeholder="опц."
                className="rounded-inset border border-brass-500/40 bg-parchment-200/50 px-3 py-2 font-body text-base text-ink-950 outline-none focus:border-ember-600"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600">
              Стратегия
            </span>
            <select
              value={bulkStrategy}
              onChange={(e) => handleStrategy(e.target.value as NpcStrategy)}
              className="rounded-inset border border-brass-500/40 bg-parchment-200/50 px-3 py-2 font-body text-base text-ink-950 outline-none focus:border-ember-600"
            >
              {STRATEGIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={submitBulk}
            disabled={bulk.isPending || bulkCount < 1 || bulkCount > slotsLeft}
            className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-4 py-2 font-display text-sm uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bulk.isPending ? 'куём…' : `Наковать ${bulkCount}`}
          </button>
          {bulkErr !== null && (
            <p role="alert" className="font-body text-xs italic text-blood-600">
              {bulkErr}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
