import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { RecoveryCode } from './RecoveryCode';
import { useAccessToken } from '../api/auth-storage';
import { useCurrentUser, useLogout } from '../api/auth-queries';

export function AppShell({ children }: { children: ReactNode }) {
  const token = useAccessToken();
  const { data: user, isError, refetch } = useCurrentUser();
  const logout = useLogout();
  const location = useLocation();
  const navigate = useNavigate();
  const content = useRef<HTMLDivElement>(null);
  const previousPath = useRef(location.pathname);
  const [confirmLogout, setConfirmLogout] = useState(false);
  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    content.current?.focus();
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a
        className="skip-link"
        href="#content"
        onClick={(event) => {
          event.preventDefault();
          content.current?.focus();
        }}
      >
        К содержимому
      </a>
      <header className="app-header">
        <div className="page-container flex flex-wrap items-center justify-between gap-3 py-4">
          <Link
            to="/"
            aria-label="Ultimatum — главная"
            className="flex items-center gap-2 text-lg font-bold"
          >
            <span className="brand-mark" aria-hidden="true">
              U
            </span>
            Ultimatum
          </Link>
          <nav
            aria-label="Основная навигация"
            className="order-2 flex w-full flex-wrap items-center justify-center gap-1 sm:order-none sm:w-auto"
          >
            <NavLink to="/lobby" className="nav-link">
              Игры
            </NavLink>
            <NavLink to="/guide" className="nav-link">
              Руководство
            </NavLink>
            {token ? (
              <NavLink to="/history" className="nav-link">
                Мои игры
              </NavLink>
            ) : (
              <NavLink to="/practice" className="nav-link">
                Попробовать
              </NavLink>
            )}
          </nav>
          {token ? (
            <div className="flex max-w-full flex-wrap items-center gap-2">
              <span className="max-w-20 truncate text-sm sm:max-w-40">
                {user?.nickname ?? 'Ваш профиль'}
              </span>
              <button className="nav-link" onClick={() => setConfirmLogout(true)}>
                Выйти
              </button>
            </div>
          ) : (
            <Link className="nav-link" to="/register">
              Войти
            </Link>
          )}
        </div>
      </header>
      {token && <RecoveryCode key={user?.id ?? 'profile'} />}
      {confirmLogout && token && (
        <section className="page-container py-4" aria-label="Подтверждение выхода">
          <div className="notice flex flex-col gap-3">
            <p>
              Перед выходом сохраните код восстановления в разделе «Код входа». С ним вы сможете
              вернуться в свои игры. Простое обновление страницы выхода не требует.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="button button-secondary" onClick={() => setConfirmLogout(false)}>
                Остаться
              </button>
              <button
                className="button"
                disabled={logout.isPending}
                onClick={() =>
                  logout.mutate(undefined, {
                    onSettled: () => {
                      setConfirmLogout(false);
                      navigate('/', { replace: true });
                    },
                  })
                }
              >
                Выйти из профиля
              </button>
            </div>
          </div>
        </section>
      )}
      {isError && token && (
        <div role="alert" className="page-container py-3">
          <p>
            Не удалось загрузить профиль.{' '}
            <button className="text-link" onClick={() => void refetch()}>
              Повторить
            </button>
          </p>
        </div>
      )}
      <div id="content" ref={content} tabIndex={-1} className="outline-none">
        {children}
      </div>
      <footer className="page-container flex flex-wrap justify-between gap-3 py-8 text-sm text-muted">
        <span>Ultimatum · у каждого своя справедливость</span>
        <Link className="text-link" to="/rules">
          Как играть
        </Link>
      </footer>
    </>
  );
}
