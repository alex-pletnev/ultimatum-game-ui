import { useId } from 'react';

/*
 * Number-stepper: − / +. Не HTML `<input type="number">` — на iOS/Safari он
 * поднимает нативную клавиатуру и портит стилистику. Пергамент и латунь.
 */

type Props = {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  hint?: string;
};

export function NumberStepper({ label, value, onChange, min, max, step = 1, hint }: Props) {
  const id = useId();
  const decId = `${id}-dec`;
  const incId = `${id}-inc`;

  const clamp = (n: number): number => Math.max(min, Math.min(max, n));
  const dec = () => onChange(clamp(value - step));
  const inc = () => onChange(clamp(value + step));

  return (
    <div className="flex flex-col gap-2">
      <span id={id} className="font-mono text-[10px] uppercase tracking-[0.35em] text-brass-600">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={id}
        className="flex items-center gap-3 rounded-inset border border-brass-500/40 bg-parchment-50/50 px-4 py-2"
      >
        <button
          id={decId}
          type="button"
          aria-label={`уменьшить ${label}`}
          onClick={dec}
          disabled={value <= min}
          className="font-display text-2xl leading-none text-ink-950 transition hover:text-ember-600 disabled:cursor-not-allowed disabled:opacity-30"
        >
          −
        </button>
        <span
          aria-live="polite"
          aria-atomic="true"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          role="spinbutton"
          className="flex-1 text-center font-display text-2xl text-ink-950"
        >
          {value}
        </span>
        <button
          id={incId}
          type="button"
          aria-label={`увеличить ${label}`}
          onClick={inc}
          disabled={value >= max}
          className="font-display text-2xl leading-none text-ink-950 transition hover:text-ember-600 disabled:cursor-not-allowed disabled:opacity-30"
        >
          +
        </button>
      </div>
      {hint !== undefined && (
        <span className="font-body text-xs italic text-ink-900/60">{hint}</span>
      )}
    </div>
  );
}
