import { Link } from 'react-router';
import { Parchment } from './components/Parchment';
import { WaxSeal } from './components/WaxSeal';

export function App() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <Parchment className="w-full max-w-xl">
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
            <button
              type="button"
              className="rounded-panel border border-ember-600/40 bg-ember-500 px-8 py-3 font-display text-sm uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] hover:shadow-[0_5px_0_var(--color-ember-700)] active:translate-y-[1px] active:shadow-[0_2px_0_var(--color-ember-700)]"
              disabled
              aria-disabled
              title="Скоро — сессии и лобби (T-004+)"
            >
              Войти за стол
            </button>
            <Link
              to="/_style-guide"
              className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-900/50 hover:text-ember-700"
            >
              → книга правил (style guide)
            </Link>
          </div>
        </div>
      </Parchment>
    </main>
  );
}
