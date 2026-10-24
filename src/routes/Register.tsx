import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Parchment } from '../components/Parchment';
import { InkField } from '../components/InkField';
import { RoleChoice } from '../components/RoleChoice';
import { useQuickRegister } from '../api/auth-queries';
import { useAccessToken } from '../api/auth-storage';
import { ApiError } from '../api/client';
import type { AssignableRole } from '../api/types';

export function Register() {
  const [search] = useSearchParams();
  const requestedNext = search.get('next');
  const next = requestedNext?.match(/^\/session\/[a-zA-Z0-9-]+$/) ? requestedNext : null;
  const [nickname, setNickname] = useState('');
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

  if (token !== null && !register.isPending) return <Navigate to={destination} replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
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
  const serverError =
    register.error instanceof ApiError && register.error.status < 500
      ? (register.error.body?.message ?? 'Не удалось войти. Попробуйте другое имя.')
      : register.error
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
          {!next && search.get('intent') !== 'solo' && (
            <RoleChoice value={role} onChange={setRole} />
          )}
          {(localError ?? serverError) && (
            <p role="alert" className="error-message">
              {localError ?? serverError}
            </p>
          )}
          <button type="submit" disabled={register.isPending} className="button">
            {register.isPending ? 'Входим…' : 'Продолжить'}
          </button>
          <p className="text-sm text-muted">
            Это временный профиль в этом браузере. После выхода вернуться под тем же именем не
            получится.
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
