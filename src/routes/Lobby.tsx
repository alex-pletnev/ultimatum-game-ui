import { Link, Navigate } from 'react-router';
import { useAccessToken } from '../api/auth-storage';
import { useCurrentUser } from '../api/auth-queries';
import { useOpenSessions } from '../api/session-queries';
import { SessionCard } from '../components/SessionCard';
import { Parchment } from '../components/Parchment';
import { WaxSeal } from '../components/WaxSeal';

function LobbyHeader({ canCreate }: { canCreate: boolean }) {
  return (
    <header className="mb-10 flex items-end justify-between gap-4 border-b border-brass-500/30 pb-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-brass-500">
          Собрание играющих
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase tracking-[0.16em] text-parchment-100">
          Открытые партии
        </h1>
      </div>
      <div className="flex flex-col items-end gap-3">
        {canCreate && (
          <Link
            to="/lobby/new"
            className="rounded-panel border border-ember-600/40 bg-ember-500 px-5 py-2 font-display text-xs uppercase tracking-[0.24em] text-night-950 shadow-[0_3px_0_var(--color-ember-700)] transition hover:translate-y-[-1px]"
          >
            Учредить партию
          </Link>
        )}
        <Link
          to="/"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-parchment-300/60 hover:text-ember-400"
        >
          ← вернуться ко входу
        </Link>
      </div>
    </header>
  );
}

function SkeletonCard() {
  return (
    <div
      aria-hidden
      className="h-64 animate-pulse rounded-card bg-parchment-100/40"
      style={{ boxShadow: 'var(--shadow-parchment)' }}
    />
  );
}

function EmptyState() {
  return (
    <Parchment className="mx-auto max-w-lg text-center">
      <div className="flex flex-col items-center gap-4">
        <WaxSeal size={72} monogram="§" />
        <h2 className="font-display text-xl uppercase tracking-[0.16em] text-ink-950">
          Стол пуст
        </h2>
        <p className="font-body italic text-ink-900/80">
          Ни одной открытой партии сейчас нет. Дождись, пока ведущий учредит новую —
          либо стань ведущим сам.
        </p>
      </div>
    </Parchment>
  );
}

function ErrorState({ retry }: { retry: () => void }) {
  return (
    <Parchment className="mx-auto max-w-lg text-center">
      <div className="flex flex-col items-center gap-4">
        <WaxSeal size={72} monogram="!" />
        <h2 className="font-display text-xl uppercase tracking-[0.16em] text-blood-500">
          Стол не отвечает
        </h2>
        <p className="font-body italic text-ink-900/80">
          Не удалось получить перечень партий. Проверь связь с backend'ом (см. `docs/05-api.md`).
        </p>
        <button
          type="button"
          onClick={retry}
          className="rounded-panel border border-ember-600/40 bg-ember-500 px-6 py-2 font-display text-xs uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px]"
        >
          Постучать снова
        </button>
      </div>
    </Parchment>
  );
}

export function Lobby() {
  const token = useAccessToken();
  const { data: user } = useCurrentUser();
  const { data, isLoading, isError, refetch } = useOpenSessions();

  if (token === null) return <Navigate to="/" replace />;

  // Backend не гарантирует сортировку — упорядочиваем свежие сверху для UX.
  const sessions = [...(data?.content ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const canCreate = user?.role === 'ADMIN';

  return (
    <div className="mx-auto max-w-5xl px-8 py-16">
      <LobbyHeader canCreate={canCreate} />

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {isError && <ErrorState retry={() => void refetch()} />}

      {!isLoading && !isError && sessions.length === 0 && <EmptyState />}

      {!isLoading && !isError && sessions.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} currentUser={user} />
          ))}
        </div>
      )}
    </div>
  );
}
