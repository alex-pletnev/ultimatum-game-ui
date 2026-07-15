import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

/*
 * «Чернильная запись» — поле ввода, стилизованное под подпись пером на пергаменте.
 * Нижняя brass-полоса вместо стандартного border, курсор ember.
 */

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label: string;
  hint?: string;
  error?: ReactNode;
};

export const InkField = forwardRef<HTMLInputElement, Props>(function InkField(
  { label, hint, error, id, ...inputProps },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedById = hint || error ? `${inputId}-desc` : undefined;

  return (
    <label htmlFor={inputId} className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-brass-600">
        {label}
      </span>
      <input
        ref={ref}
        id={inputId}
        aria-describedby={describedById}
        aria-invalid={error !== undefined ? true : undefined}
        className="w-full bg-transparent px-1 py-2 font-body text-xl italic text-ink-950 caret-ember-500 outline-none placeholder:text-ink-900/40"
        style={{
          borderBottom: `1px solid var(--color-brass-500)`,
        }}
        {...inputProps}
      />
      {(hint || error) && (
        <span
          id={describedById}
          className={`font-body text-sm italic ${
            error !== undefined ? 'text-blood-500' : 'text-ink-900/60'
          }`}
        >
          {error ?? hint}
        </span>
      )}
    </label>
  );
});
