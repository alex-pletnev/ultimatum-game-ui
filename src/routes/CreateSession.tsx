import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Parchment } from '../components/Parchment';
import { WaxSeal } from '../components/WaxSeal';
import { InkField } from '../components/InkField';
import { NumberStepper } from '../components/NumberStepper';
import { useAccessToken } from '../api/auth-storage';
import { useCurrentUser } from '../api/auth-queries';
import { useCreateSession } from '../api/session-queries';
import { ApiError } from '../api/client';
import type { SessionType } from '../api/types';

const NAME_MIN = 3;
const NAME_MAX = 100;
const TIMEOUT_MOVE_SEC_DEFAULT = 60;

const typeChoices: Array<{ value: SessionType; title: string; description: string }> = [
  {
    value: 'FREE_FOR_ALL',
    title: 'Все против всех',
    description: 'Каждый предлагает каждому, никаких союзов',
  },
  {
    value: 'TEAM_BATTLE',
    title: 'Битва команд',
    description: 'Игроки делятся на команды, предлагают чужой стороне',
  },
];

function validateName(name: string): string | null {
  const t = name.trim();
  if (t.length < NAME_MIN) return `Название короче ${NAME_MIN} букв`;
  if (t.length > NAME_MAX) return `Название длиннее ${NAME_MAX} букв`;
  return null;
}

export function CreateSession() {
  const token = useAccessToken();
  const { data: user } = useCurrentUser();

  const [displayName, setDisplayName] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('FREE_FOR_ALL');
  const [numRounds, setNumRounds] = useState(3);
  const [numPlayers, setNumPlayers] = useState(4);
  const [numTeams, setNumTeams] = useState(2);
  const [roundSum, setRoundSum] = useState(100);
  const [localError, setLocalError] = useState<string | null>(null);

  const create = useCreateSession();
  const navigate = useNavigate();

  if (token === null) return <Navigate to="/" replace />;
  if (user !== undefined && user.role !== 'ADMIN') {
    return <Navigate to="/lobby" replace />;
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const nameErr = validateName(displayName);
    if (nameErr !== null) {
      setLocalError(nameErr);
      return;
    }
    setLocalError(null);
    create.mutate(
      {
        displayName: displayName.trim(),
        config: {
          sessionType,
          numRounds,
          numTeams: sessionType === 'TEAM_BATTLE' ? numTeams : 0,
          numPlayers,
          roundSum,
          timeoutMoveSec: TIMEOUT_MOVE_SEC_DEFAULT,
        },
      },
      { onSuccess: () => navigate('/lobby') },
    );
  };

  const serverError =
    create.error instanceof ApiError
      ? create.error.body?.message ?? create.error.message
      : create.error !== null && create.error !== undefined
        ? 'Стол не отвечает — попробуй ещё раз'
        : null;

  const err = localError ?? serverError;

  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <Parchment className="w-full max-w-2xl">
        <form onSubmit={submit} className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <WaxSeal size={72} monogram="A" />
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-brass-600">
              Устав новой партии
            </p>
            <h1 className="font-display text-3xl uppercase tracking-[0.16em] text-ink-950">
              Учредить партию
            </h1>
            <span className="h-px w-24 bg-brass-500/60" />
          </div>

          <InkField
            label="Название партии"
            placeholder="Например, Круг наивных"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={NAME_MAX + 8}
            autoFocus
            hint={`От ${NAME_MIN} до ${NAME_MAX} букв`}
          />

          <fieldset className="flex flex-col gap-3">
            <legend className="font-mono text-[10px] uppercase tracking-[0.35em] text-brass-600">
              Устройство партии
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {typeChoices.map((c) => {
                const selected = sessionType === c.value;
                return (
                  <label
                    key={c.value}
                    className={`cursor-pointer rounded-card border px-4 py-3 text-left transition ${
                      selected
                        ? 'border-ember-600 bg-parchment-200/60 shadow-[inset_0_1px_0_var(--color-parchment-50)]'
                        : 'border-brass-500/40 hover:border-brass-500 hover:bg-parchment-200/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sessionType"
                      value={c.value}
                      checked={selected}
                      onChange={() => setSessionType(c.value)}
                      className="sr-only"
                    />
                    <div className="font-display text-sm uppercase tracking-[0.16em] text-ink-950">
                      {c.title}
                    </div>
                    <div className="mt-1 font-body text-xs italic text-ink-900/70">
                      {c.description}
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            <NumberStepper label="Раундов" value={numRounds} onChange={setNumRounds} min={1} max={10} />
            <NumberStepper label="Игроков" value={numPlayers} onChange={setNumPlayers} min={2} max={8} />
            {sessionType === 'TEAM_BATTLE' && (
              <NumberStepper label="Команд" value={numTeams} onChange={setNumTeams} min={2} max={3} />
            )}
            <NumberStepper
              label="Ставка"
              value={roundSum}
              onChange={setRoundSum}
              min={10}
              max={1000}
              step={10}
              hint="Раздел этой суммы обсуждается за столом"
            />
          </div>

          {err !== null && (
            <div
              role="alert"
              className="rounded-inset border border-blood-500/40 bg-blood-500/10 px-4 py-3 font-body text-sm italic text-blood-600"
            >
              {err}
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-panel border border-ember-600/40 bg-ember-500 px-8 py-3 font-display text-sm uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] hover:shadow-[0_5px_0_var(--color-ember-700)] active:translate-y-[1px] active:shadow-[0_2px_0_var(--color-ember-700)] disabled:cursor-wait disabled:opacity-60"
            >
              {create.isPending ? 'учреждаем партию…' : 'Огласить партию'}
            </button>
            <Link
              to="/lobby"
              className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-900/50 hover:text-ember-700"
            >
              ← вернуться в лобби
            </Link>
          </div>
        </form>
      </Parchment>
    </main>
  );
}
