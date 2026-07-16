import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Parchment } from '../components/Parchment';
import { WaxSeal } from '../components/WaxSeal';
import { InkField } from '../components/InkField';
import { RoleChoice } from '../components/RoleChoice';
import { useQuickRegister } from '../api/auth-queries';
import { ApiError } from '../api/client';
import type { AssignableRole } from '../api/types';

const NICKNAME_MIN = 3;
const NICKNAME_MAX = 42;

function validateNickname(nick: string): string | null {
  const trimmed = nick.trim();
  if (trimmed.length < NICKNAME_MIN) return `Имя короче ${NICKNAME_MIN} букв — вписать полнее`;
  if (trimmed.length > NICKNAME_MAX) return `Имя длиннее ${NICKNAME_MAX} букв — сократить`;
  return null;
}

export function Register() {
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState<AssignableRole>('PLAYER');
  const [localError, setLocalError] = useState<string | null>(null);

  const register = useQuickRegister();
  const navigate = useNavigate();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err = validateNickname(nickname);
    if (err !== null) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    register.mutate(
      { nickname: nickname.trim(), role },
      { onSuccess: () => navigate('/') },
    );
  };

  const serverError =
    register.error instanceof ApiError
      ? register.error.body?.message ?? register.error.message
      : register.error !== null && register.error !== undefined
        ? 'Стол не отвечает — попробуй ещё раз'
        : null;

  const displayedError = localError ?? serverError;

  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <Parchment className="w-full max-w-lg">
        <form onSubmit={submit} className="flex flex-col gap-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <WaxSeal size={72} monogram="§" />
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-brass-600">
              Запись в книгу играющих
            </p>
            <h1 className="font-display text-3xl uppercase tracking-[0.16em] text-ink-950">
              Присесть за стол
            </h1>
            <span className="h-px w-24 bg-brass-500/60" />
          </div>

          <p className="font-body text-base italic leading-relaxed text-ink-900/80">
            Как желаешь быть известен среди играющих? И под каким уставом
            намерен подойти к столу — как играющий или как ведущий?
          </p>

          <div className="flex flex-col gap-6 text-left">
            <InkField
              label="Имя"
              placeholder="Например, Alice the Fair"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={NICKNAME_MAX + 8}
              autoFocus
              autoComplete="nickname"
              hint={`От ${NICKNAME_MIN} до ${NICKNAME_MAX} букв`}
            />
            <RoleChoice value={role} onChange={setRole} />
          </div>

          {displayedError !== null && (
            <div
              role="alert"
              className="rounded-inset border border-blood-500/40 bg-blood-500/10 px-4 py-3 font-body text-sm italic text-blood-600"
            >
              {displayedError}
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <button
              type="submit"
              disabled={register.isPending}
              className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-8 py-3 font-display text-sm uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] hover:shadow-[0_5px_0_var(--color-ember-700)] active:translate-y-[1px] active:shadow-[0_2px_0_var(--color-ember-700)] disabled:cursor-wait disabled:opacity-60"
            >
              {register.isPending ? 'занимаете место…' : 'Присесть за стол'}
            </button>
            <Link
              to="/"
              className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-900/50 hover:text-ember-700"
            >
              ← вернуться ко входу
            </Link>
          </div>
        </form>
      </Parchment>
    </main>
  );
}
