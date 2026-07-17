import { useId } from 'react';
import { WaxSeal } from './WaxSeal';
import type { AssignableRole } from '../api/types';

/*
 * Выбор роли при регистрации — как «выбор персонажа» из книги правил.
 * Две карточки бок о бок, keyboard-accessible через <input type="radio">.
 */

type Choice = {
  value: AssignableRole;
  monogram: string;
  title: string;
  description: string;
};

const choices: Choice[] = [
  {
    value: 'PLAYER',
    monogram: 'P',
    title: 'Играющий',
    description: 'Предлагает раздел и отвечает на чужие предложения',
  },
  {
    value: 'ADMIN',
    monogram: 'A',
    title: 'Ведущий',
    description: 'Учреждает партию, открывает и закрывает раунды',
  },
];

type Props = {
  value: AssignableRole;
  onChange: (role: AssignableRole) => void;
  name?: string;
};

export function RoleChoice({ value, onChange, name = 'role' }: Props) {
  const groupId = useId();

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="font-mono text-[10px] uppercase tracking-[0.25em] text-brass-600 sm:tracking-[0.35em]">
        Выбор роли
      </legend>
      <div className="grid grid-cols-2 gap-3">
        {choices.map((c) => {
          const selected = value === c.value;
          const inputId = `${groupId}-${c.value}`;
          return (
            <label
              key={c.value}
              htmlFor={inputId}
              className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-card border px-4 py-4 text-center transition ${
                selected
                  ? 'border-ember-600 bg-parchment-200/60 shadow-[inset_0_1px_0_var(--color-parchment-50)]'
                  : 'border-brass-500/40 bg-transparent hover:border-brass-500 hover:bg-parchment-200/30'
              }`}
            >
              <input
                type="radio"
                id={inputId}
                name={name}
                value={c.value}
                checked={selected}
                onChange={() => onChange(c.value)}
                className="sr-only"
              />
              <WaxSeal size={44} monogram={c.monogram} />
              <span className="font-display text-sm uppercase tracking-[0.16em] text-ink-950">
                {c.title}
              </span>
              <span className="font-body text-xs italic leading-snug text-ink-900/70">
                {c.description}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
