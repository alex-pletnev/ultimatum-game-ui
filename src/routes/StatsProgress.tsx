import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { StatsRow } from '../api/stats-queries';
import { Parchment } from '../components/Parchment';
import { computeCumulativeScores, computeEconomy, type PlayerRow } from './Stats.aggregations';

const colors = ['#1e675e', '#943c16', '#4549a0', '#915a18', '#9b3265', '#395a80'];
export function StatsProgress({
  rows,
  roundSum,
  players,
}: {
  rows: StatsRow[];
  roundSum: number;
  players: PlayerRow[];
}) {
  const [selected, setSelected] = useState('');
  const economy = computeEconomy(rows, roundSum);
  const cumulative = computeCumulativeScores(rows, roundSum);
  const shown = selected ? players.filter((p) => p.userId === selected) : players.slice(0, 6);
  const earned = economy.reduce((sum, round) => sum + round.earned, 0);
  const lost = economy.reduce((sum, round) => sum + round.lost, 0);
  return (
    <>
      <Parchment className="mt-6">
        <h2 className="text-2xl font-semibold">Накопленный счёт</h2>
        <p className="my-3 text-sm">
          Общий заработок к концу каждого раунда. Ожидающие ответа сделки не добавляют монеты.
        </p>
        <label className="mb-4 flex flex-col gap-2">
          Показать на графике
          <select
            className="rounded-panel border bg-white p-3"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Первые шесть в рейтинге</option>
            {players.map((p) => (
              <option key={p.userId} value={p.userId}>
                {p.nickname}
              </option>
            ))}
          </select>
        </label>
        <div
          role="img"
          aria-label="График накопленного счёта. Точные значения — в таблице под графиком."
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={cumulative} margin={{ right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="round" name="Раунд" tickFormatter={(r) => `Р${r}`} />
              <YAxis width={45} />
              <Tooltip labelFormatter={(r) => `Раунд ${r}`} />
              <Legend />
              {shown.map((p, index) => (
                <Line
                  key={p.userId}
                  dataKey={p.userId}
                  name={p.nickname}
                  stroke={colors[index % colors.length] ?? '#1e675e'}
                  strokeWidth={3}
                  strokeDasharray={index % 2 ? '6 3' : 'none'}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3">
          <summary>Счёт по раундам — таблица</summary>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Накопленный счёт выбранных игроков</caption>
              <thead>
                <tr>
                  <th className="p-2" scope="col">
                    Раунд
                  </th>
                  {shown.map((p) => (
                    <th className="p-2" key={p.userId} scope="col">
                      {p.nickname}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cumulative.map((r) => (
                  <tr key={r.round}>
                    <th scope="row" className="p-2">
                      {r.round}
                    </th>
                    {shown.map((p) => (
                      <td className="p-2" key={p.userId}>
                        {r[p.userId] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Parchment>
      <Parchment className="mt-6">
        <h2 className="text-2xl font-semibold">Экономика раундов</h2>
        <p className="my-3">
          Получено <strong>{earned}</strong> монет. Потеряно из-за отказов <strong>{lost}</strong>.{' '}
          {earned + lost > 0
            ? `Сохранено ${Math.round((earned / (earned + lost)) * 100)}% разыгранных монет.`
            : 'Решённых сделок пока нет.'}
        </p>
        <div
          role="img"
          aria-label="Полученные, потерянные и ожидающие решения монеты по раундам. Значения доступны в таблице."
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={economy} margin={{ right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="round" tickFormatter={(r) => `Р${r}`} />
              <YAxis width={45} />
              <Tooltip labelFormatter={(r) => `Раунд ${r}`} />
              <Legend />
              <Bar
                dataKey="earned"
                name="Получено"
                stackId="coins"
                fill="#1e675e"
                isAnimationActive={false}
              />
              <Bar
                dataKey="lost"
                name="Потеряно"
                stackId="coins"
                fill="#9b3535"
                isAnimationActive={false}
              />
              <Bar
                dataKey="pending"
                name="Без ответа"
                stackId="coins"
                fill="#7e746c"
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3">
          <summary>Монеты по раундам — таблица</summary>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Экономика раундов в монетах</caption>
              <thead>
                <tr>
                  {['Раунд', 'Получено', 'Потеряно', 'Без ответа'].map((name) => (
                    <th className="p-2" key={name} scope="col">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {economy.map((r) => (
                  <tr key={r.round}>
                    <th className="p-2" scope="row">
                      {r.round}
                    </th>
                    <td className="p-2">{r.earned}</td>
                    <td className="p-2">{r.lost}</td>
                    <td className="p-2">{r.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Parchment>
    </>
  );
}
