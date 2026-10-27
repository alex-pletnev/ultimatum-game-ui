import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Parchment } from '../components/Parchment';
import type { StatsRow } from '../api/stats-queries';
import { computeTeams } from './Stats.aggregations';

export function TeamStats({ rows, roundSum }: { rows: StatsRow[]; roundSum: number }) {
  const [round, setRound] = useState('');
  const teams = computeTeams(
    round ? rows.filter((r) => r.roundNumber === Number(round)) : rows,
    roundSum,
  );
  return (
    <Parchment className="mt-6">
      <h2 className="text-2xl font-semibold">Результаты команд</h2>
      <p className="my-3 text-sm">
        Предложения — сколько команда отдавала соперникам. Принятия и отказы — как её участники
        отвечали на входящие предложения. Счёт включает заработок в обеих ролях.
      </p>
      <label className="mb-5 flex flex-col gap-2">
        Раунды команд
        <select
          className="rounded-panel border bg-white p-3"
          value={round}
          onChange={(e) => setRound(e.target.value)}
        >
          <option value="">Вся партия</option>
          {[...new Set(rows.map((r) => r.roundNumber))]
            .sort((a, b) => a - b)
            .map((n) => (
              <option key={n} value={n}>
                Раунд {n}
              </option>
            ))}
        </select>
      </label>
      <div className="grid gap-5 md:grid-cols-2">
        <div
          role="img"
          aria-label="Средние предложения команд в монетах. Точные значения в таблице ниже."
        >
          <h3 className="mb-3 font-semibold">Среднее предложение · монеты</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={teams}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis width={40} domain={[0, roundSum]} />
              <Tooltip />
              <Bar
                dataKey="avgOffer"
                name="Среднее предложение"
                fill="#1e675e"
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div
          role="img"
          aria-label="Принятия и отказы каждой команды. Точные значения в таблице ниже."
        >
          <h3 className="mb-3 font-semibold">Ответы команд · количество</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={teams}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis width={30} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="accepted" name="Принято" fill="#1e675e" isAnimationActive={false} />
              <Bar dataKey="rejected" name="Отказ" fill="#943c16" isAnimationActive={false} />
              <Bar dataKey="pending" name="Без ответа" fill="#7e746c" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Точные показатели команд</caption>
          <thead>
            <tr>
              {[
                'Команда',
                'Счёт',
                'Предложений',
                'Среднее',
                'Принято',
                'Отказов',
                'Без ответа',
              ].map((label) => (
                <th className="p-2" scope="col" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-t border-brass-500/20">
                <th className="p-2" scope="row">
                  {team.name}
                </th>
                {[
                  team.score,
                  team.offers,
                  team.avgOffer.toFixed(1),
                  team.accepted,
                  team.rejected,
                  team.pending,
                ].map((value, i) => (
                  <td className="p-2" key={i}>
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Parchment>
  );
}
