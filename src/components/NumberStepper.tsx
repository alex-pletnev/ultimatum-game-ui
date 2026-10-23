import { useId, useEffect, useState } from 'react';

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
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const clamp = (n: number) => Math.max(min, Math.min(max, Math.round(n)));
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-panel border border-brass-500/40 bg-parchment-50 p-2">
        <button
          type="button"
          aria-label={`уменьшить ${label}`}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          className="w-12 shrink-0 rounded-inset text-2xl hover:bg-parchment-200"
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={draft}
          required
          onBlur={() => {
            const n = draft.trim() ? Number(draft) : value;
            const next = Number.isFinite(n) ? clamp(n) : value;
            setDraft(String(next));
            onChange(next);
          }}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = e.target.valueAsNumber;
            if (Number.isInteger(n) && n >= min && n <= max) onChange(n);
          }}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="w-full min-w-0 bg-transparent text-center text-xl font-semibold"
        />
        <button
          type="button"
          aria-label={`увеличить ${label}`}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          className="w-12 shrink-0 rounded-inset text-2xl hover:bg-parchment-200"
        >
          +
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-ink-900/70">
          {hint}
        </p>
      )}
    </div>
  );
}
