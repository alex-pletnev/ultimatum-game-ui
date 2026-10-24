import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import { readRecentGame } from '../api/recent-game';
import { useAccessToken } from '../api/auth-storage';
import { useCurrentUser } from '../api/auth-queries';
import { useOpenSessions } from '../api/session-queries';
import { SessionCard } from '../components/SessionCard';
import { Parchment } from '../components/Parchment';

export function Lobby() {
  const token = useAccessToken();
  const { data: user } = useCurrentUser();
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, isFetching, refetch } = useOpenSessions(page, 8);
  if (token === null) return <Navigate to="/register" replace />;
  const sessions = [...(data?.content ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const canCreate = user?.role === 'ADMIN' || user?.role === 'PLAYER';
  const recent = user ? readRecentGame(user.id) : null;
  return (
    <main className="page-container py-10">
      <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <span className="eyebrow">
            {user ? `Здравствуйте, ${user.nickname}` : 'Вместе интереснее'}
          </span>
          <h1 className="mt-2 text-3xl font-semibold">Игры</h1>
          <p className="mt-3 text-muted">Выберите игру ниже или откройте ссылку от ведущего.</p>
        </div>
        {canCreate && (
          <Link className="button" to="/lobby/new">
            Создать игру
          </Link>
        )}
      </header>
      {canCreate && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <Link className="choice-card" to="/play">
            <span>
              <strong>Играть с ботом</strong>
              <span className="mt-1 block text-sm">Начните сразу, без приглашений и ожидания.</span>
            </span>
          </Link>
          <Link className="choice-card" to="/history">
            <span>
              <strong>Мои игры</strong>
              <span className="mt-1 block text-sm">Продолжите партию или откройте результаты.</span>
            </span>
          </Link>
        </div>
      )}
      {recent && (
        <aside className="notice mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm">Ваша последняя игра</p>
            <strong className="break-all">{recent.name}</strong>
          </div>
          <Link
            className="button button-secondary"
            to={`/session/${recent.id}${recent.finished ? '/stats' : ''}`}
          >
            {recent.finished ? 'Посмотреть результаты' : 'Вернуться в игру'}
          </Link>
        </aside>
      )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Открытые игры</h2>
        <button className="text-link" disabled={isFetching} onClick={() => void refetch()}>
          {isFetching ? 'Обновляем…' : 'Обновить список'}
        </button>
      </div>
      {isLoading && (
        <p role="status" className="notice">
          Загружаем игры…
        </p>
      )}
      {isError && (
        <Parchment>
          <h2 className="text-xl font-semibold">Не удалось загрузить игры</h2>
          <p className="my-4">Проверьте подключение к интернету и попробуйте ещё раз.</p>
          <button className="button button-secondary" onClick={() => void refetch()}>
            Повторить
          </button>
        </Parchment>
      )}
      {!isLoading && !isError && sessions.length === 0 && (
        <Parchment className="flex flex-col items-start gap-4">
          <h2 className="text-2xl font-semibold">Пока нет открытых игр</h2>
          <p>
            {page > 0
              ? 'На этой странице больше нет игр. Вернитесь к началу списка.'
              : canCreate
                ? 'Создайте первую и пригласите друзей. Свободные места можно заполнить ботами.'
                : 'Попросите ведущего создать игру и прислать ссылку. Список обновляется автоматически.'}
          </p>
          {page > 0 ? (
            <button className="button" onClick={() => setPage(0)}>
              К началу списка
            </button>
          ) : (
            <Link className="button button-secondary" to={canCreate ? '/lobby/new' : '/practice'}>
              {canCreate ? 'Создать игру' : 'Пока попробовать учебный раунд'}
            </Link>
          )}
        </Parchment>
      )}
      {!isLoading && !isError && sessions.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} currentUser={user} />
          ))}
        </div>
      )}
      {(page > 0 || (data?.totalPages ?? 0) > 1) && (
        <nav
          aria-label="Страницы игр"
          className="mt-6 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            className="button button-secondary"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Назад
          </button>
          <span>
            Страница {page + 1} из {Math.max(page + 1, data?.totalPages ?? 1)}
          </span>
          <button
            className="button button-secondary"
            disabled={page + 1 >= (data?.totalPages ?? 1)}
            onClick={() => setPage(page + 1)}
          >
            Далее
          </button>
        </nav>
      )}
      <aside className="mt-8 flex flex-wrap gap-5 text-sm">
        <Link className="text-link" to="/rules">
          Как играть
        </Link>
        <Link className="text-link" to="/practice">
          Учебный раунд
        </Link>
        {user?.role === 'ADMIN' && (
          <Link className="text-link" to="/npc">
            Настроить ботов
          </Link>
        )}
      </aside>
    </main>
  );
}
