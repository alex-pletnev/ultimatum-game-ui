import { Link } from 'react-router';
import { Parchment } from './components/Parchment';
import { WaxSeal } from './components/WaxSeal';
import { useAccessToken } from './api/auth-storage';
import { useCurrentUser, useLogout } from './api/auth-queries';

function RoleLabel({ role }: { role: string }) {
  const label =
    role === 'ADMIN' ? 'ведущий' : role === 'OBSERVER' ? 'наблюдатель' : 'играющий';
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-brass-600">
      {label}
    </span>
  );
}

function Welcome() {
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();

  if (isLoading || user === undefined) {
    return (
      <div className="text-center font-body italic text-ink-900/60">
        Смотрим твоё имя в книге играющих…
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-brass-600">
        Anno MMXXVI · Volumen I
      </p>

      <div className="flex flex-col items-center gap-2">
        <p className="font-body italic text-ink-900/70">Добро пожаловать,</p>
        <h1 className="font-display text-4xl uppercase tracking-[0.16em] text-ink-950">
          {user.nickname}
        </h1>
        <RoleLabel role={user.role} />
        <span className="mt-2 h-px w-24 bg-brass-500/60" />
      </div>

      <WaxSeal size={88} monogram={user.nickname.charAt(0).toUpperCase()} />

      <p className="font-body text-base italic leading-relaxed text-ink-900/85">
        Стол готов. Скоро сюда добавим лобби с открытыми партиями и приглашения
        к текущим.
      </p>

      <div className="flex flex-col items-center gap-3">
        <Link
          to="/lobby"
          className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-8 py-3 font-display text-sm uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] hover:shadow-[0_5px_0_var(--color-ember-700)] active:translate-y-[1px] active:shadow-[0_2px_0_var(--color-ember-700)]"
        >
          Открыть лобби
        </Link>
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-900/50 transition hover:text-blood-500 disabled:opacity-50"
        >
          {logout.isPending ? 'уходим…' : '← встать из-за стола'}
        </button>
      </div>
    </div>
  );
}

function TitleCard() {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-brass-600">
        Anno MMXXVI · Volumen I
      </p>

      <div className="flex flex-col items-center gap-2">
        <h1 className="font-display text-5xl font-semibold uppercase tracking-[0.16em] text-ink-950">
          Ultimatum
        </h1>
        <span className="h-px w-32 bg-brass-500/60" />
        <p className="font-body text-lg italic text-ink-900/80">
          A game of offers, refusals & reckoning
        </p>
      </div>

      <WaxSeal size={104} monogram="U" />

      <p className="font-body text-base leading-relaxed text-ink-900/85">
        Двое встречаются за столом. Первый предлагает раздел общей ставки —
        второй принимает или отвергает. Отказ обнуляет обоих. Так проверяется,
        что дороже: справедливость или монета.
      </p>

      <div className="flex flex-col items-center gap-3">
        <Link
          to="/register"
          className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-8 py-3 font-display text-sm uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] hover:shadow-[0_5px_0_var(--color-ember-700)] active:translate-y-[1px] active:shadow-[0_2px_0_var(--color-ember-700)]"
        >
          Присесть за стол
        </Link>
        <Link
          to="/_style-guide"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-900/50 hover:text-ember-700"
        >
          → книга правил (style guide)
        </Link>
      </div>
    </div>
  );
}

export function App() {
  const token = useAccessToken();

  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <Parchment className="w-full max-w-xl">
        {token !== null ? <Welcome /> : <TitleCard />}
      </Parchment>
    </main>
  );
}
