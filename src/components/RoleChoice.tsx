import type { AssignableRole } from '../api/types';

const choices = [
  {
    value: 'PLAYER',
    title: 'Присоединиться',
    description: 'Найти игру или открыть приглашение друзей.',
  },
  {
    value: 'ADMIN',
    title: 'Создать игру',
    description: 'Пригласить друзей, играть вместе и управлять раундами.',
  },
] as const;

export function RoleChoice({
  value,
  onChange,
  name = 'role',
}: {
  value: AssignableRole;
  onChange: (role: AssignableRole) => void;
  name?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 font-semibold">Что хотите сделать?</legend>
      {choices.map((choice) => (
        <label
          key={choice.value}
          className={`choice-card ${value === choice.value ? 'choice-selected' : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={choice.value}
            checked={value === choice.value}
            onChange={() => onChange(choice.value)}
          />
          <span>
            <span className="block font-semibold">{choice.title}</span>
            <span className="mt-1 block text-sm text-ink-900/70">{choice.description}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
