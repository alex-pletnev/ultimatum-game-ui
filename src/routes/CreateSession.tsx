import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Parchment } from '../components/Parchment';
import { InkField } from '../components/InkField';
import { NumberStepper } from '../components/NumberStepper';
import { useAccessToken } from '../api/auth-storage';
import { useCurrentUser } from '../api/auth-queries';
import { useCreateSession } from '../api/session-queries';
import type { SessionType } from '../api/types';

export function CreateSession() {
  const token = useAccessToken();
  const { data: user, isError, refetch } = useCurrentUser();
  const [displayName, setDisplayName] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('FREE_FOR_ALL');
  const [numRounds, setNumRounds] = useState(3);
  const [numPlayers, setNumPlayers] = useState(4);
  const [roundSum, setRoundSum] = useState(100);
  const [autoAdvanceRounds, setAutoAdvanceRounds] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const create = useCreateSession();
  const navigate = useNavigate();

  if (token === null) return <Navigate to="/register?intent=host" replace />;
  if (user && user.role !== 'ADMIN') return <Navigate to="/lobby" replace />;
  if (!user)
    return (
      <p className="page-container py-10" role={isError ? 'alert' : 'status'}>
        {isError ? (
          <>
            Не удалось загрузить профиль.{' '}
            <button className="text-link" onClick={() => void refetch()}>
              Повторить
            </button>
          </>
        ) : (
          'Загружаем профиль…'
        )}
      </p>
    );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const name = displayName.trim() || 'Новая игра';
    if (name.length < 3 || name.length > 100) {
      setLocalError('Название должно содержать от 3 до 100 символов.');
      field.current?.focus();
      return;
    }
    if (sessionType === 'TEAM_BATTLE' && numPlayers % 2 !== 0) {
      setLocalError('Для двух команд выберите чётное число игроков.');
      return;
    }
    setLocalError(null);
    create.mutate(
      {
        displayName: name,
        config: {
          sessionType,
          numRounds,
          numTeams: sessionType === 'TEAM_BATTLE' ? 2 : 0,
          numPlayers,
          roundSum,
          timeoutMoveSec: 60,
          autoAdvanceRounds,
        },
      },
      { onSuccess: (created) => navigate(`/session/${created.id}`) },
    );
  };
  return (
    <main className="page-container max-w-2xl py-10">
      <Parchment>
        <form onSubmit={submit} className="flex flex-col gap-6">
          <div>
            <span className="eyebrow">Вы — ведущий</span>
            <h1 className="mt-2 text-3xl font-semibold">Создать игру</h1>
            <p className="mt-3 text-ink-900/70">
              Настройки уже готовы. Создайте игру, затем отправьте друзьям ссылку. Вы управляете
              раундами и не занимаете место игрока.
            </p>
          </div>
          <InkField
            ref={field}
            label="Название игры"
            placeholder="Новая игра"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={100}
            hint="Можно оставить пустым"
            error={localError ?? undefined}
          />
          <NumberStepper
            label="Игроков"
            value={numPlayers}
            onChange={setNumPlayers}
            min={2}
            max={120}
            hint="Максимум участников, без ведущего. Начать можно от двух игроков."
          />
          <div className="notice">
            {numRounds} раунда · {roundSum} монет на сделку ·{' '}
            {sessionType === 'TEAM_BATTLE' ? 'две команды' : 'каждый за себя'}
          </div>
          <details>
            <summary>Дополнительные настройки</summary>
            <div className="mt-4 flex flex-col gap-6">
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 font-semibold">Режим игры</legend>
                {(
                  [
                    {
                      value: 'FREE_FOR_ALL',
                      label: 'Каждый за себя',
                      hint: 'Получайте предложения от случайных игроков.',
                    },
                    {
                      value: 'TEAM_BATTLE',
                      label: 'Команды',
                      hint: 'Две команды. Игроки договариваются с соперниками.',
                    },
                  ] as const
                ).map((choice) => (
                  <label
                    key={choice.value}
                    className={`choice-card ${sessionType === choice.value ? 'choice-selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="sessionType"
                      checked={sessionType === choice.value}
                      onChange={() => {
                        setSessionType(choice.value);
                        if (choice.value === 'TEAM_BATTLE' && numPlayers % 2 !== 0)
                          setNumPlayers(numPlayers + 1);
                      }}
                    />
                    <span>
                      <strong>{choice.label}</strong>
                      <span className="mt-1 block text-sm">{choice.hint}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              {sessionType === 'TEAM_BATTLE' && (
                <p className="text-sm">
                  Две команды: перед стартом в каждой должно быть поровну игроков.
                </p>
              )}
              <NumberStepper
                label="Раундов"
                value={numRounds}
                onChange={setNumRounds}
                min={1}
                max={10}
              />
              <NumberStepper
                label="Монет на сделку"
                value={roundSum}
                onChange={setRoundSum}
                min={10}
                max={100000}
                step={10}
              />
              <label className="choice-card">
                <input
                  type="checkbox"
                  checked={autoAdvanceRounds}
                  onChange={(e) => setAutoAdvanceRounds(e.target.checked)}
                />
                <span>
                  <strong>Начинать следующий раунд автоматически</strong>
                  <span className="mt-1 block text-sm">
                    Сразу после всех ответов. Выключите, если хотите обсудить результат между
                    раундами.
                  </span>
                </span>
              </label>
            </div>
          </details>
          {(localError || create.isError) && (
            <p role="alert" className="error-message">
              {localError ?? 'Не удалось создать игру. Настройки сохранены — попробуйте ещё раз.'}
            </p>
          )}
          <button className="button" disabled={create.isPending}>
            {create.isPending ? 'Создаём игру…' : 'Создать игру'}
          </button>
          <Link className="text-link text-center" to="/lobby">
            Отмена
          </Link>
        </form>
      </Parchment>
    </main>
  );
}
