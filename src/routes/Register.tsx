import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Parchment } from '../components/Parchment';
import { InkField } from '../components/InkField';
import { RoleChoice } from '../components/RoleChoice';
import { useQuickRegister, useRecoverProfile } from '../api/auth-queries';
import { useAccessToken } from '../api/auth-storage';
import { ApiError } from '../api/client';
import type { AssignableRole } from '../api/types';

export function Register() {
  const [search] = useSearchParams();
  const requestedNext = search.get('next');
  const next = requestedNext?.match(/^\/session\/[a-zA-Z0-9-]+$/) ? requestedNext : null;
  const [nickname, setNickname] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const recover = useRecoverProfile();
  const [role, setRole] = useState<AssignableRole>(
    search.get('intent') === 'host' ? 'ADMIN' : 'PLAYER',
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const register = useQuickRegister();
  const token = useAccessToken();
  const navigate = useNavigate();
  const destination =
    next ??
    (search.get('intent') === 'solo' ? '/play' : role === 'ADMIN' ? '/lobby/new' : '/lobby');

  if (token !== null && !register.isPending && !recover.isPending)
    return <Navigate to={recovering ? (next ?? '/history') : destination} replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (recovering) {
      if (!recoveryCode.trim()) {
        setLocalError('Введите код восстановления.');
        return;
      }
      setLocalError(null);
      recover.mutate(recoveryCode.trim(), {
        onSuccess: () => navigate(next ?? '/history', { replace: true }),
      });
      return;
    }
    if (nickname.trim().length < 3 || nickname.trim().length > 42) {
      setLocalError('Введите имя от 3 до 42 символов.');
      field.current?.focus();
      return;
    }
    setLocalError(null);
    register.mutate(
      { nickname: nickname.trim(), role: 'PLAYER' },
      { onSuccess: () => navigate(destination, { replace: true }) },
    );
  };
  const error = recovering ? recover.error : register.error;
  const serverError =
    error instanceof ApiError && error.status < 500
      ? (error.body?.message ?? 'Не удалось войти. Проверьте введённые данные.')
      : error
        ? 'Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз.'
        : null;

  return (
    <main className="page-container max-w-xl py-10">
      <Parchment>
        <form onSubmit={submit} noValidate className="flex flex-col gap-6">
          <div>
            <span className="eyebrow">{next ? 'Приглашение в игру' : 'Без пароля и почты'}</span>
            <h1 className="mt-2 text-3xl font-semibold">Как вас зовут?</h1>
            <p className="mt-3 text-muted">
              Другие игроки увидят это имя.{' '}
              {next ? 'После входа вы вернётесь к приглашению.' : 'Выберите, что хотите сделать.'}
            </p>
          </div>
          <button
            type="button"
            className="text-link self-start"
            onClick={() => {
              setRecovering(!recovering);
              setLocalError(null);
            }}
          >
            {recovering ? 'Создать новый профиль' : 'Вернуться по коду'}
          </button>
          {recovering ? (
            <InkField
              label="Код восстановления"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              autoComplete="off"
              maxLength={100}
              hint="Код возвращает ваши игры и права ведущего. Имя вводить повторно не нужно."
            />
          ) : (
            <InkField
              ref={field}
              label="Имя"
              placeholder="Например, Алекс"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setLocalError(null);
              }}
              maxLength={42}
              autoComplete="nickname"
              hint="От 3 до 42 символов"
              error={localError ?? undefined}
            />
          )}
          {!recovering && !next && search.get('intent') !== 'solo' && (
            <RoleChoice value={role} onChange={setRole} />
          )}
          {(localError ?? serverError) && (
            <p role="alert" className="error-message">
              {localError ?? serverError}
            </p>
          )}
          <button
            type="submit"
            disabled={register.isPending || recover.isPending}
            className="button"
          >
            {register.isPending || recover.isPending
              ? 'Входим…'
              : recovering
                ? 'Восстановить вход'
                : 'Продолжить'}
          </button>
          <p className="text-sm text-muted">
            Вход сохраняется в браузере. Сохраните секретный код в разделе «Код входа», чтобы
            вернуться после выхода или с другого устройства.
          </p>
          <Link
            className="text-link text-center"
            to={next ? `/practice?next=${encodeURIComponent(next)}` : '/practice'}
          >
            Сначала попробовать без регистрации
          </Link>
        </form>
      </Parchment>
    </main>
  );
}
