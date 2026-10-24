import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

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
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-semibold text-ink-900">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-describedby={describedById}
        aria-invalid={error !== undefined ? true : undefined}
        className="w-full rounded-panel border border-brass-500/50 bg-parchment-50 px-3 py-3 text-base text-ink-950 placeholder:text-muted"
        {...inputProps}
      />
      {(hint || error) && (
        <span
          id={describedById}
          className={`text-sm ${error !== undefined ? 'text-blood-500' : 'text-muted'}`}
        >
          {error ?? hint}
        </span>
      )}
    </div>
  );
});
