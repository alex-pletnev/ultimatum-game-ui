import { Link, Navigate } from 'react-router';
import { useAccessToken } from '../api/auth-storage';
import { useOpenSessions } from '../api/session-queries';
import { SessionCard } from '../components/SessionCard';
import { Parchment } from '../components/Parchment';
import { WaxSeal } from '../components/WaxSeal';

function LobbyHeader() {
  return (
    <header className="mb-10 flex items-baseline justify-between border-b border-brass-500/30 pb-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-brass-500">
          Собрание играющих
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase tracking-[0.16em] text-parchment-100">
          Открытые партии
        </h1>
      </div>
      <Link
        to="/"
        className="font-mono text-[10px] uppercase tracking-[0.3em] text-parchment-300/60 hover:text-ember-400"
      >
        ← вернуться ко входу
      </Link>
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
  const { data, isLoading, isError, refetch } = useOpenSessions();

  if (token === null) return <Navigate to="/" replace />;

  const sessions = data?.content ?? [];

  return (
    <div className="mx-auto max-w-5xl px-8 py-16">
      <LobbyHeader />

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
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}
