import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router';
import { App } from './App';
import { AppShell } from './components/AppShell';
import { CreateSession } from './routes/CreateSession';
import { Lobby } from './routes/Lobby';
import { Register } from './routes/Register';
import { Session } from './routes/Session';
import { Practice } from './routes/Practice';
import { Rules } from './routes/Rules';

const Stats = lazy(() => import('./routes/Stats').then((m) => ({ default: m.Stats })));
const Npc = lazy(() => import('./routes/Npc').then((m) => ({ default: m.Npc })));
const StyleGuide = lazy(() =>
  import('./routes/StyleGuide').then((m) => ({ default: m.StyleGuide })),
);

export function AnimatedRoutes() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <p role="status" className="page-container py-12">
            Загружаем страницу…
          </p>
        }
      >
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/register" element={<Register />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/lobby/new" element={<CreateSession />} />
          <Route path="/npc" element={<Npc />} />
          <Route path="/session/:id" element={<Session />} />
          <Route path="/session/:id/stats" element={<Stats />} />
          <Route path="/_style-guide" element={<StyleGuide />} />
          <Route
            path="*"
            element={
              <main className="page-container py-12">
                <h1 className="text-3xl font-semibold">Страница не найдена</h1>
                <p className="my-4">
                  Возможно, в ссылке ошибка. Можно вернуться к играм или попробовать учебный раунд.
                </p>
                <Link className="button" to="/">
                  На главную
                </Link>
              </main>
            }
          />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
