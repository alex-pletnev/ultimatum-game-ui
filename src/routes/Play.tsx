import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Parchment } from '../components/Parchment';
import { useAccessToken } from '../api/auth-storage';
import { useCurrentUser } from '../api/auth-queries';
import { useSoloSession } from '../api/session-queries';
import { NPC_STRATEGIES } from '../api/npc-strategies';
import type { NpcStrategy, SessionType } from '../api/types';

export function Play() {
  const token = useAccessToken();
  const { data: user } = useCurrentUser();
  const [strategy, setStrategy] = useState<NpcStrategy>('FAIR');
  const [sessionType, setSessionType] = useState<SessionType>('FREE_FOR_ALL');
  const [numRounds, setNumRounds] = useState(3);
  const solo = useSoloSession();
  const navigate = useNavigate();
  if (!token) return <Navigate to="/register?intent=solo" replace />;
  return (
    <main className="page-container max-w-2xl py-10">
      <Parchment>
        <span className="eyebrow">Играйте в своём темпе</span>
        <h1 className="mt-2 text-3xl font-semibold">Вы против бота</h1>
        <p className="my-5 text-ink-900/70">
          Настоящая партия со счётом и статистикой. Вы делаете ход, бот отвечает сам. Между раундами
          можно посмотреть результат и продолжить, когда будете готовы.
        </p>
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            solo.mutate(
              { strategy, sessionType, numRounds },
              { onSuccess: (game) => navigate(`/session/${game.id}`) },
            );
          }}
        >
          <label className="flex flex-col gap-2">
            Соперник
            <select
              className="rounded-panel border bg-white p-3"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as NpcStrategy)}
            >
              {NPC_STRATEGIES.map((bot) => (
                <option key={bot.value} value={bot.value}>
                  {bot.title}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm">{NPC_STRATEGIES.find((bot) => bot.value === strategy)?.hint}</p>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 font-semibold">Правила</legend>
            {[
              {
                value: 'FREE_FOR_ALL',
                title: 'Ультиматум',
                hint: 'Можно отказаться. Тогда оба получают 0.',
              },
              {
                value: 'DICTATOR',
                title: 'Диктатор',
                hint: 'Раздел принимается автоматически. Отказаться нельзя.',
              },
            ].map((mode) => (
              <label
                key={mode.value}
                className={`choice-card ${sessionType === mode.value ? 'choice-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="mode"
                  checked={sessionType === mode.value}
                  onChange={() => setSessionType(mode.value as SessionType)}
                />
                <span>
                  <strong>{mode.title}</strong>
                  <span className="mt-1 block text-sm">{mode.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="flex flex-col gap-2">
            Длительность
            <select
              className="rounded-panel border bg-white p-3"
              value={numRounds}
              onChange={(e) => setNumRounds(Number(e.target.value))}
            >
              <option value={3}>3 раунда — познакомиться</option>
              <option value={5}>5 раундов — испытать стратегию</option>
              <option value={10}>10 раундов — длинная партия</option>
            </select>
          </label>
          {user && !['PLAYER', 'ADMIN'].includes(user.role) ? (
            <p className="notice">
              Этот профиль наблюдателя. Для игры выйдите из него и создайте профиль игрока.
            </p>
          ) : (
            <button className="button" disabled={solo.isPending}>
              {solo.isPending ? 'Готовим игру…' : 'Начать игру с ботом'}
            </button>
          )}
          {solo.isError && (
            <p role="alert" className="error-message">
              Не удалось начать игру. Настройки сохранены — попробуйте ещё раз.
            </p>
          )}
        </form>
        <Link className="text-link mt-5 inline-block" to="/practice">
          Сначала пройти учебный раунд
        </Link>
      </Parchment>
    </main>
  );
}
