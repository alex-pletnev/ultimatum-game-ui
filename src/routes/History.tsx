import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import { useAccessToken } from '../api/auth-storage';
import { useMySessions } from '../api/session-queries';
import { Parchment } from '../components/Parchment';
import type { SessionState } from '../api/types';

const states: Record<SessionState, string> = {
  CREATED: 'Ожидает игроков',
  RUNNING: 'Идёт игра',
  FINISHED: 'Завершена',
  ABORTED: 'Прервана',
};
export function History() {
  const token = useAccessToken();
  const [page, setPage] = useState(0);
  const games = useMySessions(page);
  if (!token) return <Navigate to="/register" replace />;
  return (
    <main className="page-container py-10">
      <h1 className="text-3xl font-semibold">Мои игры</h1>
      <p className="mb-7 mt-3 text-ink-900/70">
        Партии, которые вы создали, играли или наблюдали в этом профиле. Сначала — новые.
      </p>
      {games.isLoading && <p role="status">Загружаем историю…</p>}
      {games.isError && (
        <p role="alert" className="notice">
          Не удалось загрузить историю.{' '}
          <button className="text-link" onClick={() => void games.refetch()}>
            Повторить
          </button>
        </p>
      )}
      {games.data?.content.length === 0 && (
        <Parchment>
          <h2 className="text-xl font-semibold">Здесь будут ваши игры</h2>
          <p className="my-4">Начните с ботом или создайте партию для друзей.</p>
          <Link className="button" to="/play">
            Играть с ботом
          </Link>
        </Parchment>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {games.data?.content.map((game) => (
          <Parchment key={game.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <span className="badge">{states[game.state]}</span>
              <time dateTime={game.createdAt} className="text-sm">
                {new Date(game.createdAt).toLocaleDateString('ru-RU')}
              </time>
            </div>
            <h2 className="my-3 break-words text-xl font-semibold">{game.displayName}</h2>
            <p className="mb-4 text-sm">
              {game.config.sessionType === 'DICTATOR'
                ? 'Диктатор'
                : game.config.sessionType === 'TEAM_BATTLE'
                  ? 'Команды'
                  : 'Ультиматум'}{' '}
              · {game.config.numRounds} раунда · ведущий {game.admin.nickname}
            </p>
            <Link
              className="button button-secondary"
              to={`/session/${game.id}${['FINISHED', 'ABORTED'].includes(game.state) ? '/stats' : ''}`}
            >
              {['FINISHED', 'ABORTED'].includes(game.state) ? 'Результаты' : 'Открыть игру'}
            </Link>
          </Parchment>
        ))}
      </div>
      {(page > 0 || (games.data?.totalPages ?? 0) > 1) && (
        <nav aria-label="Страницы истории" className="mt-6 flex items-center justify-center gap-4">
          <button
            className="button button-secondary"
            disabled={!page || games.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Назад
          </button>
          <span>Страница {page + 1}</span>
          <button
            className="button button-secondary"
            disabled={games.isFetching || page + 1 >= (games.data?.totalPages ?? 0)}
            onClick={() => setPage(page + 1)}
          >
            Далее
          </button>
        </nav>
      )}
    </main>
  );
}
