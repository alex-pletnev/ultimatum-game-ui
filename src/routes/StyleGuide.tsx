import { Link } from 'react-router';
import { Parchment } from '../components/Parchment';
import { WaxSeal } from '../components/WaxSeal';

/* ─────────────────────  Данные для swatches (единственное место с hex'ами)  ────────── */

const palettes: Array<{ name: string; shades: Array<{ shade: string; token: string }> }> = [
  {
    name: 'Night — стол в полутьме',
    shades: [
      { shade: '50', token: '--color-night-50' },
      { shade: '100', token: '--color-night-100' },
      { shade: '200', token: '--color-night-200' },
      { shade: '300', token: '--color-night-300' },
      { shade: '400', token: '--color-night-400' },
      { shade: '500', token: '--color-night-500' },
      { shade: '600', token: '--color-night-600' },
      { shade: '700', token: '--color-night-700' },
      { shade: '800', token: '--color-night-800' },
      { shade: '900', token: '--color-night-900' },
      { shade: '950', token: '--color-night-950' },
    ],
  },
  {
    name: 'Parchment — карты и свитки',
    shades: [
      { shade: '50', token: '--color-parchment-50' },
      { shade: '100', token: '--color-parchment-100' },
      { shade: '200', token: '--color-parchment-200' },
      { shade: '300', token: '--color-parchment-300' },
      { shade: '400', token: '--color-parchment-400' },
      { shade: '500', token: '--color-parchment-500' },
    ],
  },
  {
    name: 'Ember — свеча, действие, Claude-accent',
    shades: [
      { shade: '300', token: '--color-ember-300' },
      { shade: '400', token: '--color-ember-400' },
      { shade: '500', token: '--color-ember-500' },
      { shade: '600', token: '--color-ember-600' },
      { shade: '700', token: '--color-ember-700' },
    ],
  },
  {
    name: 'Brass — латунь, инициалы',
    shades: [
      { shade: '300', token: '--color-brass-300' },
      { shade: '400', token: '--color-brass-400' },
      { shade: '500', token: '--color-brass-500' },
      { shade: '600', token: '--color-brass-600' },
    ],
  },
  {
    name: 'Blood — сургуч, отказ',
    shades: [
      { shade: '400', token: '--color-blood-400' },
      { shade: '500', token: '--color-blood-500' },
      { shade: '600', token: '--color-blood-600' },
    ],
  },
  {
    name: 'Verdigris — окисленная медь, cool balance',
    shades: [
      { shade: '500', token: '--color-verdigris-500' },
      { shade: '600', token: '--color-verdigris-600' },
    ],
  },
];

/* ────────────────────────────────  UI-хелперы  ─────────────────────────────────────── */

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="font-display text-xs font-semibold uppercase tracking-[0.4em] text-brass-400">
      {children}
    </h2>
  );
}

function Swatch({ shade, token }: { shade: string; token: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="h-16 w-full rounded-inset border border-night-700"
        style={{ background: `var(${token})` }}
      />
      <div className="flex items-baseline justify-between text-[10px] font-mono text-parchment-300/70">
        <span className="uppercase tracking-widest">{shade}</span>
        <span>{token.replace('--color-', '')}</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────  Экран  ──────────────────────────────────────────── */

export function StyleGuide() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-16">
      <header className="mb-16 flex items-baseline justify-between border-b border-brass-500/30 pb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-brass-500">
            Приложение · Книга правил
          </p>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-[0.16em] text-parchment-100">
            Style Guide
          </h1>
        </div>
        <Link
          to="/"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-parchment-300/60 hover:text-ember-400"
        >
          ← вернуться к столу
        </Link>
      </header>

      {/* ─────────────  1. Палитры  ───────────── */}
      <section className="mb-20 space-y-10">
        <SectionTitle>I · Палитра</SectionTitle>
        {palettes.map((palette) => (
          <div key={palette.name} className="space-y-3">
            <h3 className="font-body text-lg italic text-parchment-200">{palette.name}</h3>
            <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-11">
              {palette.shades.map((s) => (
                <Swatch key={s.token} shade={s.shade} token={s.token} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ─────────────  2. Типографика  ───────────── */}
      <section className="mb-20 space-y-8">
        <SectionTitle>II · Типографика</SectionTitle>

        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-500">
            Display · Cinzel — заголовки, wax-seal, титулы разделов
          </p>
          <p className="font-display text-5xl uppercase tracking-[0.16em] text-parchment-100">
            Ultimatum
          </p>
          <p className="font-display text-3xl uppercase tracking-[0.16em] text-parchment-200">
            Круг ведущего
          </p>
          <p className="font-display text-lg uppercase tracking-[0.24em] text-brass-400">
            Раунд III
          </p>
        </div>

        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-500">
            Body · EB Garamond — «книга правил», описание раундов, объяснения
          </p>
          <p className="font-body text-xl text-parchment-100">
            Двое встречаются за столом. Первый предлагает раздел общей ставки —
            второй принимает или отвергает.
          </p>
          <p className="font-body italic text-lg text-parchment-200/80">
            «Отказ обнуляет обоих» — правило справедливости, знакомое каждому ребёнку.
          </p>
          <p className="font-body text-sm text-parchment-300/70">
            Мелкий шрифт для сносок и примечаний ведущего.
          </p>
        </div>

        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-500">
            Mono · JetBrains Mono — голос системы, «мастер объявляет»
          </p>
          <p className="font-mono text-sm text-parchment-100">
            ROUND 03 · WAIT_OFFERS · 00:42 elapsed
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-parchment-300/70">
            session · #a12f · 4 players seated
          </p>
        </div>
      </section>

      {/* ─────────────  3. Тени и глубина  ───────────── */}
      <section className="mb-20 space-y-6">
        <SectionTitle>III · Тени и глубина</SectionTitle>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-3">
            <div
              className="h-32 rounded-card bg-parchment-100"
              style={{ boxShadow: 'var(--shadow-parchment)' }}
            />
            <div className="text-[10px] font-mono uppercase tracking-widest text-parchment-300/70">
              --shadow-parchment · лист над столом
            </div>
          </div>

          <div className="space-y-3">
            <div
              className="h-32 rounded-card bg-night-800"
              style={{ boxShadow: 'var(--shadow-candlelit)' }}
            />
            <div className="text-[10px] font-mono uppercase tracking-widest text-parchment-300/70">
              --shadow-candlelit · свеча + inset-highlight
            </div>
          </div>

          <div className="space-y-3">
            <div
              className="h-32 rounded-card bg-ember-500"
              style={{ boxShadow: 'var(--shadow-wax-inset)' }}
            />
            <div className="text-[10px] font-mono uppercase tracking-widest text-parchment-300/70">
              --shadow-wax-inset · оттиск в воске
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────  4. Примитивы  ───────────── */}
      <section className="mb-20 space-y-8">
        <SectionTitle>IV · Примитивы</SectionTitle>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-brass-500">
              Parchment · «карта / свиток»
            </p>
            <Parchment>
              <p className="font-display text-lg uppercase tracking-widest text-ink-950">
                Offer #7
              </p>
              <p className="mt-2 font-body italic text-ink-900/80">
                34 из 100 · предложено Алисой
              </p>
            </Parchment>
          </div>

          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-brass-500">
              Wax seal · монограмма и подпись
            </p>
            <div className="flex items-center justify-center rounded-card bg-parchment-100 p-8">
              <div className="flex items-center gap-6">
                <WaxSeal size={80} monogram="U" />
                <WaxSeal size={60} monogram="R" />
                <WaxSeal size={48} monogram="P" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-brass-500">
              Token · круглая фишка игрока
            </p>
            <div className="flex items-center gap-4 rounded-card bg-night-800 p-6">
              {[
                { label: 'A', color: 'var(--color-ember-500)' },
                { label: 'B', color: 'var(--color-verdigris-500)' },
                { label: 'C', color: 'var(--color-brass-500)' },
                { label: 'D', color: 'var(--color-blood-500)' },
              ].map((t) => (
                <div
                  key={t.label}
                  className="grid h-12 w-12 place-items-center rounded-token font-display text-lg font-semibold text-night-950"
                  style={{ background: t.color, boxShadow: 'var(--shadow-candlelit)' }}
                >
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-brass-500">
              Divider · латунный разделитель
            </p>
            <div className="flex flex-col gap-6 rounded-card bg-night-800 p-8">
              <div className="flex items-center gap-4">
                <span className="h-px flex-1 bg-brass-500/50" />
                <WaxSeal size={24} monogram="§" />
                <span className="h-px flex-1 bg-brass-500/50" />
              </div>
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-brass-500/30" />
                <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-brass-400">
                  Раунд III
                </span>
                <span className="h-px flex-1 bg-brass-500/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-brass-500/30 pt-6 font-mono text-[10px] uppercase tracking-widest text-parchment-300/40">
        Токены живут в <code>src/styles/tokens.css</code> · этот экран —{' '}
        <code>src/routes/StyleGuide.tsx</code>
      </footer>
    </div>
  );
}
