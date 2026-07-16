import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { Parchment } from '../components/Parchment';
import { WaxSeal } from '../components/WaxSeal';
import { useSessionDetails } from '../api/session-queries';
import { useSessionStats, type StatsRow } from '../api/stats-queries';
import {
  computeHistogram,
  computeLeaderboard,
  computeSummary,
  computeTimeline,
  type HistogramBin,
  type PlayerRow,
  type Summary,
  type TimelinePoint,
} from './Stats.aggregations';

/* ────────────────────  Палитра настолки  ────────────────────
 * Recharts не читает CSS vars — дублируем hex'ы для fill/stroke.
 */
const C_EMBER = '#dc7a2e';
const C_BRASS = '#a8873f';
const C_VERDIGRIS = '#4a7c74';
const C_BLOOD = '#8f2a2a';
const C_INK = '#3d2f24';

/* ────────────────────  UI-компоненты  ──────────────────── */

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-panel border border-brass-500/25 bg-parchment-50/70 px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600">
        {label}
      </span>
      <span className="font-display text-2xl text-ink-950">{value}</span>
      {hint !== undefined && (
        <span className="font-body text-[11px] italic text-ink-900/60">{hint}</span>
      )}
    </div>
  );
}

function SummaryCards({ s, roundSum }: { s: Summary; roundSum: number }) {
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <SummaryCard label="Раундов" value={String(s.totalRounds)} />
      <SummaryCard
        label="Офферов"
        value={String(s.totalOffers)}
        hint={`решено ${s.totalDecisions}`}
      />
      <SummaryCard
        label="Средний"
        value={s.avgOffer.toFixed(1)}
        hint={`из ${roundSum}`}
      />
      <SummaryCard label="Принято" value={pct(s.acceptRate)} />
      <SummaryCard label="Щедрейший" value={String(s.mostGenerous)} />
      <SummaryCard label="Скупейший" value={String(s.mostGreedy)} />
    </div>
  );
}

function Leaderboard({ players, currentUserId }: { players: PlayerRow[]; currentUserId: string }) {
  return (
    <div className="overflow-hidden rounded-panel border border-brass-500/30">
      <table className="w-full text-sm">
        <thead className="bg-parchment-100/60 font-mono text-[10px] uppercase tracking-[0.2em] text-brass-700">
          <tr>
            <th className="px-4 py-2 text-left">Игрок</th>
            <th className="px-3 py-2 text-right">Счёт</th>
            <th className="px-3 py-2 text-right">Офферов</th>
            <th className="px-3 py-2 text-right">Сред. offer</th>
            <th className="px-3 py-2 text-right">Accept как resp.</th>
          </tr>
        </thead>
        <tbody className="font-body text-ink-900">
          {players.map((p) => {
            const isMe = p.userId === currentUserId;
            return (
              <tr
                key={p.userId}
                className={`border-t border-brass-500/15 ${isMe ? 'bg-ember-500/10' : ''}`}
              >
                <td className="px-4 py-2">
                  <span className={`font-display uppercase tracking-[0.1em] ${isMe ? 'text-ember-700' : ''}`}>
                    {p.nickname}
                    {isMe && ' · ты'}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-display text-lg">
                  {p.totalScore}
                </td>
                <td className="px-3 py-2 text-right">{p.offersMade}</td>
                <td className="px-3 py-2 text-right">{p.avgProposed.toFixed(1)}</td>
                <td className="px-3 py-2 text-right">
                  {Math.round(p.acceptRateAsResponder * 100)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-10 mb-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-brass-500/40" />
      <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-brass-600">
        {children}
      </span>
      <span className="h-px flex-1 bg-brass-500/40" />
    </div>
  );
}

function OfferHistogram({ bins }: { bins: HistogramBin[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={bins} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={`${C_BRASS}33`} />
        <XAxis dataKey="label" tick={{ fill: C_INK, fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fill: C_INK, fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: '#f7ecd1',
            border: `1px solid ${C_BRASS}`,
            fontFamily: 'inherit',
          }}
        />
        <Bar dataKey="accepted" stackId="a" fill={C_VERDIGRIS} name="Приняли" />
        <Bar dataKey="rejected" stackId="a" fill={C_BLOOD} name="Отвергли" />
        <Bar dataKey="pending" stackId="a" fill={`${C_BRASS}80`} name="Без ответа" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TimelineOffers({ timeline }: { timeline: TimelinePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={timeline} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={`${C_BRASS}33`} />
        <XAxis
          dataKey="round"
          tick={{ fill: C_INK, fontSize: 11 }}
          label={{ value: 'раунд', position: 'insideBottom', offset: -4, fill: C_INK, fontSize: 10 }}
        />
        <YAxis tick={{ fill: C_INK, fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: '#f7ecd1',
            border: `1px solid ${C_BRASS}`,
            fontFamily: 'inherit',
          }}
        />
        <Line
          type="monotone"
          dataKey="avgOffer"
          stroke={C_EMBER}
          strokeWidth={2.5}
          dot={{ fill: C_EMBER, r: 4 }}
          name="Средний оффер"
        />
        <Line
          type="monotone"
          dataKey="acceptRate"
          stroke={C_VERDIGRIS}
          strokeWidth={2}
          strokeDasharray="4 3"
          dot={{ fill: C_VERDIGRIS, r: 3 }}
          name="% принятых"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function DecisionScatter({ rows }: { rows: StatsRow[] }) {
  // Каждая точка: x = amount, y = round; цвет = decision.
  const points = rows.map((r) => ({
    x: r.amount,
    y: r.roundNumber,
    accepted: r.accepted,
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={`${C_BRASS}33`} />
        <XAxis
          type="number"
          dataKey="x"
          name="offer"
          tick={{ fill: C_INK, fontSize: 11 }}
          label={{ value: 'offer', position: 'insideBottom', offset: -4, fill: C_INK, fontSize: 10 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="round"
          allowDecimals={false}
          tick={{ fill: C_INK, fontSize: 11 }}
          label={{ value: 'раунд', angle: -90, position: 'insideLeft', fill: C_INK, fontSize: 10 }}
        />
        <ZAxis range={[60, 60]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3', stroke: C_BRASS }}
          contentStyle={{
            background: '#f7ecd1',
            border: `1px solid ${C_BRASS}`,
            fontFamily: 'inherit',
          }}
        />
        <Scatter data={points} name="Сделки">
          {points.map((p, i) => (
            <Cell
              key={i}
              fill={p.accepted === true ? C_VERDIGRIS : p.accepted === false ? C_BLOOD : `${C_BRASS}80`}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

type SortKey = 'roundNumber' | 'amount' | 'proposerNickname' | 'responderNickname' | 'accepted';

function RawTable({ rows }: { rows: StatsRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('roundNumber');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const base =
      needle.length === 0
        ? rows
        : rows.filter(
            (r) =>
              r.proposerNickname.toLowerCase().includes(needle) ||
              r.responderNickname.toLowerCase().includes(needle),
          );
    const sorted = [...base].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      // null/undefined в конец при asc.
      if (va === vb) return 0;
      if (va === null) return sortDir === 'asc' ? 1 : -1;
      if (vb === null) return sortDir === 'asc' ? -1 : 1;
      return (va < vb ? -1 : 1) * (sortDir === 'asc' ? 1 : -1);
    });
    return sorted;
  }, [rows, sortKey, sortDir, filter]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(k);
      setSortDir('asc');
    }
  };
  const sortMark = (k: SortKey) =>
    k === sortKey ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Фильтр по имени игрока…"
        className="w-full max-w-sm rounded-panel border border-brass-500/40 bg-parchment-50/60 px-3 py-2 font-mono text-[11px] tracking-[0.05em] text-ink-900 placeholder-brass-600/60 outline-none focus:border-ember-500"
      />
      <div className="overflow-x-auto rounded-panel border border-brass-500/30">
        <table className="w-full text-xs">
          <thead className="bg-parchment-100/60 font-mono text-[10px] uppercase tracking-[0.15em] text-brass-700">
            <tr>
              <th
                className="cursor-pointer px-3 py-2 text-left"
                onClick={() => toggleSort('roundNumber')}
              >
                #{sortMark('roundNumber')}
              </th>
              <th
                className="cursor-pointer px-3 py-2 text-left"
                onClick={() => toggleSort('proposerNickname')}
              >
                Proposer{sortMark('proposerNickname')}
              </th>
              <th
                className="cursor-pointer px-3 py-2 text-left"
                onClick={() => toggleSort('responderNickname')}
              >
                Responder{sortMark('responderNickname')}
              </th>
              <th
                className="cursor-pointer px-3 py-2 text-right"
                onClick={() => toggleSort('amount')}
              >
                Offer{sortMark('amount')}
              </th>
              <th
                className="cursor-pointer px-3 py-2 text-center"
                onClick={() => toggleSort('accepted')}
              >
                Decision{sortMark('accepted')}
              </th>
              <th className="px-3 py-2 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="font-body text-ink-900">
            {filtered.map((r) => (
              <tr key={r.offerId} className="border-t border-brass-500/15">
                <td className="px-3 py-2">{r.roundNumber}</td>
                <td className="px-3 py-2">{r.proposerNickname}</td>
                <td className="px-3 py-2">{r.responderNickname}</td>
                <td className="px-3 py-2 text-right font-display">{r.amount}</td>
                <td className="px-3 py-2 text-center">
                  {r.accepted === true ? (
                    <span className="rounded-token bg-verdigris-500/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-parchment-100">
                      accept
                    </span>
                  ) : r.accepted === false ? (
                    <span className="rounded-token bg-blood-500/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-parchment-100">
                      reject
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-brass-600">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono text-[10px] text-ink-900/70">
                  {r.timestamp}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center font-body italic text-ink-900/50">
                  Ничего не найдено.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ────────────────────  Main page  ──────────────────── */

export function Stats() {
  // Публичная страница — открывается по прямой ссылке без auth
  // (BACKEND-FIX-public-stats-endpoint.md).
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSessionDetails(id);
  const { data: rows, isLoading, isError } = useSessionStats(id);

  const roundSum = session?.config.roundSum ?? 100;

  const summary = useMemo(() => computeSummary(rows ?? []), [rows]);
  const leaderboard = useMemo(
    () => computeLeaderboard(rows ?? [], roundSum),
    [rows, roundSum],
  );
  const histogram = useMemo(() => computeHistogram(rows ?? [], roundSum), [rows, roundSum]);
  const timeline = useMemo(() => computeTimeline(rows ?? []), [rows]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-8 py-16">
        <div
          aria-hidden
          className="h-96 animate-pulse rounded-card bg-parchment-100/40"
          style={{ boxShadow: 'var(--shadow-parchment)' }}
        />
      </div>
    );
  }

  const hasData = (rows?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-4xl px-8 py-16">
      <header className="mb-8 flex items-baseline justify-between border-b border-brass-500/30 pb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-brass-500">
            Летопись сделок
          </p>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-[0.16em] text-parchment-100">
            {session?.displayName ?? 'Партия'}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          {id !== undefined && (
            <Link
              to={`/session/${id}`}
              className="font-mono text-[10px] uppercase tracking-[0.3em] text-parchment-300/60 hover:text-ember-400"
            >
              ← к столу
            </Link>
          )}
          <Link
            to="/lobby"
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-parchment-300/60 hover:text-ember-400"
          >
            ← в лобби
          </Link>
        </div>
      </header>

      {isError && (
        <Parchment className="text-center">
          <div className="flex flex-col items-center gap-3">
            <WaxSeal size={48} monogram="!" />
            <p className="font-body italic text-blood-600">
              Не удалось загрузить статистику этой партии.
            </p>
          </div>
        </Parchment>
      )}

      {!isError && !hasData && (
        <Parchment className="text-center">
          <div className="flex flex-col items-center gap-3">
            <WaxSeal size={48} monogram="?" />
            <p className="font-body italic text-ink-900/70">
              Партия ещё не игралась — как только пойдут офферы, здесь появится
              летопись.
            </p>
          </div>
        </Parchment>
      )}

      {!isError && hasData && (
        <>
          <Parchment>
            <SectionTitle>Итоги партии</SectionTitle>
            <SummaryCards s={summary} roundSum={roundSum} />
          </Parchment>

          <Parchment className="mt-6">
            <SectionTitle>Игрок за игроком</SectionTitle>
            <Leaderboard players={leaderboard} currentUserId={session?.admin.id ?? ''} />
          </Parchment>

          <Parchment className="mt-6">
            <SectionTitle>Распределение офферов</SectionTitle>
            <OfferHistogram bins={histogram} />
            <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600">
              зелёные — приняты · красные — отвергнуты · тёмные — без ответа
            </p>
          </Parchment>

          <Parchment className="mt-6">
            <SectionTitle>Как менялась стратегия</SectionTitle>
            <TimelineOffers timeline={timeline} />
            <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600">
              сплошная — средний оффер · пунктир — % принятых
            </p>
          </Parchment>

          <Parchment className="mt-6">
            <SectionTitle>Карта решений</SectionTitle>
            <DecisionScatter rows={rows ?? []} />
            <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600">
              каждая точка — одна сделка; цвет — итог
            </p>
          </Parchment>

          <Parchment className="mt-6">
            <SectionTitle>Летопись сырых сделок</SectionTitle>
            <RawTable rows={rows ?? []} />
          </Parchment>
        </>
      )}
    </div>
  );
}
