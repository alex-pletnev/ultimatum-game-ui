import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { Parchment } from '../components/Parchment';
import {
  NPC_STRATEGIES as STRATEGIES,
  defaultNpcParams as defaultParams,
} from '../api/npc-strategies';
import { InkField } from '../components/InkField';
import { useAccessToken } from '../api/auth-storage';
import { useCurrentUser } from '../api/auth-queries';
import { useCreateNpc, useDeleteNpc, useNpcList } from '../api/npc-queries';
import { ApiError } from '../api/client';
import type { NpcParams, NpcProfileResponse, NpcStrategy } from '../api/types';

function ParamNumber({
  label,
  value,
  onChange,
  min,
  max,
  step,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-sm text-brass-600">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-inset border border-brass-500/40 bg-parchment-200/50 px-3 py-2 font-body text-lg text-ink-950 outline-none focus:border-ember-600"
      />
      {hint !== undefined && <span className="font-body text-xs text-muted">{hint}</span>}
    </label>
  );
}

function ParamsEditor({
  params,
  onChange,
}: {
  params: NpcParams;
  onChange: (p: NpcParams) => void;
}) {
  switch (params.type) {
    case 'FAIR':
      return (
        <ParamNumber
          label="Порог справедливости"
          value={params.fairnessThreshold ?? 0.3}
          onChange={(v) => onChange({ type: 'FAIR', fairnessThreshold: v })}
          min={0}
          max={1}
          step={0.05}
          hint="Примет предложение, если он не меньше этой доли от ставки"
        />
      );
    case 'SELFISH':
      return (
        <ParamNumber
          label="Минимальное предложение"
          value={params.minOffer ?? 0}
          onChange={(v) => onChange({ type: 'SELFISH', minOffer: v })}
          min={0}
          max={1000}
          step={1}
          hint="Сколько уступает второй стороне (в абсолюте)"
        />
      );
    case 'RANDOM':
      return (
        <ParamNumber
          label="Вероятность согласия"
          value={params.acceptProbability ?? 0.5}
          onChange={(v) => onChange({ type: 'RANDOM', acceptProbability: v })}
          min={0}
          max={1}
          step={0.05}
        />
      );
    case 'VENGEFUL':
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ParamNumber
            label="Базовая доля"
            value={params.baselineFraction ?? 0.5}
            onChange={(v) =>
              onChange({
                type: 'VENGEFUL',
                baselineFraction: v,
                punishStep: params.punishStep ?? 1,
                fairnessThreshold: params.fairnessThreshold ?? 0.3,
              })
            }
            min={0}
            max={1}
            step={0.05}
          />
          <ParamNumber
            label="Шаг наказания"
            value={params.punishStep ?? 1}
            onChange={(v) =>
              onChange({
                type: 'VENGEFUL',
                baselineFraction: params.baselineFraction ?? 0.5,
                punishStep: v,
                fairnessThreshold: params.fairnessThreshold ?? 0.3,
              })
            }
            min={0}
            max={100}
            step={1}
            hint="На сколько снижает предложение после отказа"
          />
          <ParamNumber
            label="Порог справедливости"
            value={params.fairnessThreshold ?? 0.3}
            onChange={(v) =>
              onChange({
                type: 'VENGEFUL',
                baselineFraction: params.baselineFraction ?? 0.5,
                punishStep: params.punishStep ?? 1,
                fairnessThreshold: v,
              })
            }
            min={0}
            max={1}
            step={0.05}
          />
        </div>
      );
    case 'ADAPTIVE':
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ParamNumber
            label="Базовая доля"
            value={params.baselineFraction ?? 0.5}
            onChange={(v) =>
              onChange({
                type: 'ADAPTIVE',
                baselineFraction: v,
                targetRejectRate: params.targetRejectRate ?? 0.2,
                slope: params.slope ?? 0.5,
              })
            }
            min={0}
            max={1}
            step={0.05}
          />
          <ParamNumber
            label="Желаемая доля отказов"
            value={params.targetRejectRate ?? 0.2}
            onChange={(v) =>
              onChange({
                type: 'ADAPTIVE',
                baselineFraction: params.baselineFraction ?? 0.5,
                targetRejectRate: v,
                slope: params.slope ?? 0.5,
              })
            }
            min={0}
            max={1}
            step={0.05}
          />
          <ParamNumber
            label="Крутизна реакции"
            value={params.slope ?? 0.5}
            onChange={(v) =>
              onChange({
                type: 'ADAPTIVE',
                baselineFraction: params.baselineFraction ?? 0.5,
                targetRejectRate: params.targetRejectRate ?? 0.2,
                slope: v,
              })
            }
            min={0}
            max={5}
            step={0.1}
            hint="Насколько сильно меняет предложение после ответа"
          />
        </div>
      );
  }
}

function NpcCard({
  npc,
  onDelete,
  deleting,
  deleteError,
}: {
  npc: NpcProfileResponse;
  onDelete: () => void;
  deleting: boolean;
  deleteError: string | null;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div
      data-testid={`npc-card-${npc.nickname}`}
      className="flex flex-col gap-3 rounded-card border border-brass-500/40 bg-parchment-200/40 p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-display text-sm text-ink-950">{npc.nickname}</span>
          <span className="font-mono text-sm text-brass-600">
            {STRATEGIES.find((s) => s.value === npc.strategy)?.title}
            {npc.seed !== null ? ` · seed ${npc.seed}` : ''}
          </span>
        </div>
      </div>
      <p className="text-sm text-muted">{STRATEGIES.find((s) => s.value === npc.strategy)?.hint}</p>
      <div className="flex items-center justify-between">
        <span className="font-body text-xs text-muted">
          {new Date(npc.createdAt).toLocaleString('ru-RU')}
        </span>
        <button
          type="button"
          onClick={() => setConfirm(true)}
          disabled={deleting}
          className="min-h-11 rounded-panel border border-blood-500/40 bg-transparent px-3 py-1 font-mono text-sm text-blood-500 transition hover:bg-blood-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? 'Удаляем…' : 'Удалить'}
        </button>
      </div>
      {confirm && (
        <div className="notice">
          <p>Удалить бота {npc.nickname}? Это действие нельзя отменить.</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button type="button" className="text-link" onClick={() => setConfirm(false)}>
              Отмена
            </button>
            <button
              type="button"
              className="button button-secondary"
              disabled={deleting}
              onClick={onDelete}
            >
              Да, удалить
            </button>
          </div>
        </div>
      )}
      {deleteError !== null && (
        <p role="alert" className="font-body text-xs text-blood-600">
          {deleteError}
        </p>
      )}
    </div>
  );
}

export function Npc() {
  const token = useAccessToken();
  const { data: user } = useCurrentUser();
  const list = useNpcList();
  const create = useCreateNpc();
  const del = useDeleteNpc();

  const [nickname, setNickname] = useState('');
  const [strategy, setStrategy] = useState<NpcStrategy>('FAIR');
  const [params, setParams] = useState<NpcParams>(defaultParams('FAIR'));
  const [seedText, setSeedText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleStrategy = (s: NpcStrategy) => {
    setStrategy(s);
    setParams(defaultParams(s));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed.length < 3 || trimmed.length > 42) return;
    const seed = seedText.trim().length > 0 ? Number(seedText) : null;
    create.mutate(
      { nickname: trimmed, strategy, params, seed },
      {
        onSuccess: () => {
          setNickname('');
          setSeedText('');
        },
      },
    );
  };

  const createError = useMemo(() => {
    if (create.error === null || create.error === undefined) return null;
    if (create.error instanceof ApiError) return create.error.body?.message ?? create.error.message;
    return 'Не удалось создать бота';
  }, [create.error]);

  const deleteErrorFor = (id: string): string | null => {
    if (deletingId !== id || del.error === null || del.error === undefined) return null;
    if (del.error instanceof ApiError) return del.error.body?.message ?? del.error.message;
    return 'Не удалось удалить бота';
  };

  if (token === null) return <Navigate to="/" replace />;
  if (user !== undefined && user.role !== 'ADMIN') return <Navigate to="/lobby" replace />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-16">
      <header className="mb-8 flex flex-col gap-4 border-b border-brass-500/30 pb-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-sm text-brass-600 ">Кабинет ведущего</p>
          <h1 className="mt-2 font-display text-2xl text-ink-950 sm:text-3xl">Боты</h1>
        </div>
        <Link to="/lobby" className="font-mono text-sm text-muted hover:text-ember-400">
          ← Все игры
        </Link>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_1.2fr]">
        <Parchment>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-brass-500/40" />
              <span className="font-mono text-sm text-brass-600 ">Создать бота</span>
              <span className="h-px flex-1 bg-brass-500/40" />
            </div>

            <InkField
              label="Имя бота"
              placeholder="Bob-Fair"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              hint="Уникальное имя, от 3 до 42 символов"
              minLength={3}
              maxLength={42}
              required
            />

            <fieldset className="flex flex-col gap-2">
              <legend className="font-mono text-sm text-brass-600">Стратегия</legend>
              <div className="grid grid-cols-1 gap-2">
                {STRATEGIES.map((s) => {
                  const selected = strategy === s.value;
                  return (
                    <label
                      key={s.value}
                      className={`cursor-pointer rounded-inset border px-3 py-2 transition ${
                        selected
                          ? 'border-ember-600 bg-parchment-200/60'
                          : 'border-brass-500/30 hover:border-brass-500/70'
                      }`}
                    >
                      <input
                        type="radio"
                        name="strategy"
                        value={s.value}
                        checked={selected}
                        onChange={() => handleStrategy(s.value)}
                        className="mr-2"
                      />
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-display text-sm text-ink-950">{s.title}</span>
                      </div>
                      <p className="mt-0.5 font-body text-xs text-muted">{s.hint}</p>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <details>
              <summary>Дополнительные настройки</summary>
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-sm text-brass-600">Параметры</span>
                  <ParamsEditor params={params} onChange={setParams} />
                </div>

                <label className="flex flex-col gap-1">
                  <span className="font-mono text-sm text-brass-600">
                    Число для повторяемого поведения (необязательно)
                  </span>
                  <input
                    type="number"
                    value={seedText}
                    onChange={(e) => setSeedText(e.target.value)}
                    placeholder="напр. 42"
                    className="rounded-inset border border-brass-500/40 bg-parchment-200/50 px-3 py-2 font-body text-lg text-ink-950 outline-none focus:border-ember-600"
                  />
                  <span className="font-body text-xs text-muted">
                    Одинаковое число позволяет повторить случайное поведение бота. Обычно можно
                    оставить пустым.
                  </span>
                </label>
              </div>
            </details>
            {createError !== null && (
              <p
                role="alert"
                className="rounded-inset border border-blood-500/40 bg-blood-500/10 px-3 py-2 font-body text-sm text-blood-600"
              >
                {createError}
              </p>
            )}

            <button
              type="submit"
              disabled={create.isPending || nickname.trim().length < 3}
              className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile min-h-11 px-6 py-2 font-display text-sm text-night-950 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50 "
            >
              {create.isPending ? 'Создаём…' : 'Создать бота'}
            </button>
          </form>
        </Parchment>

        <Parchment>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-brass-500/40" />
              <span className="font-mono text-sm text-brass-600">Готовые</span>
              <span className="h-px flex-1 bg-brass-500/40" />
            </div>
            {list.isLoading && <p className="font-body text-muted">Загружаем ботов…</p>}
            {list.isError && (
              <p className="font-body text-blood-600">Не удалось получить список.</p>
            )}
            {!list.isLoading && !list.isError && (list.data ?? []).length === 0 && (
              <p className="font-body text-muted">
                Отряд пуст. Выкуй первого — и он окажется здесь.
              </p>
            )}
            <div className="grid gap-3">
              {(list.data ?? []).map((npc) => (
                <NpcCard
                  key={npc.id}
                  npc={npc}
                  deleting={del.isPending && deletingId === npc.id}
                  deleteError={deleteErrorFor(npc.id)}
                  onDelete={() => {
                    setDeletingId(npc.id);
                    del.mutate(npc.id);
                  }}
                />
              ))}
            </div>
          </div>
        </Parchment>
      </div>
    </div>
  );
}
