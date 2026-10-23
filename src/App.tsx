import { Link, Navigate } from 'react-router';
import { useAccessToken } from './api/auth-storage';
import { Parchment } from './components/Parchment';

export function App() {
  const token = useAccessToken();
  if (token !== null) return <Navigate to="/lobby" replace />;

  return (
    <main className="page-container grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20">
      <section className="flex flex-col items-start gap-6">
        <span className="eyebrow">Игра о деньгах и справедливости</span>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">Ultimatum</h1>
        <p className="max-w-lg text-2xl leading-snug sm:text-3xl">
          Договоритесь о цене справедливости.
        </p>
        <p className="max-w-lg text-lg text-ink-900/75">
          У вас 100 монет на двоих. Один предлагает раздел, другой решает: принять или оставить
          обоих ни с чем.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link className="button" to="/practice">
            Попробовать без регистрации
          </Link>
          <Link className="button button-secondary" to="/register">
            Играть с друзьями
          </Link>
        </div>
        <Link className="text-link" to="/play">
          Или сыграть полноценную партию с ботом →
        </Link>
        <p className="text-sm text-ink-900/65">
          Учебный раунд — около минуты. Для игры с друзьями понадобится только имя.
        </p>
      </section>
      <Parchment className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Одна сделка. Два решения.</h2>
          <span className="badge">Пример</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-card bg-parchment-200 p-6">
            <p className="text-sm">Вы оставляете</p>
            <p className="mt-2 text-5xl font-semibold">60</p>
            <p className="text-sm">монет</p>
          </div>
          <div className="rounded-card bg-ember-500/15 p-6">
            <p className="text-sm">Предлагаете другому</p>
            <p className="mt-2 text-5xl font-semibold">40</p>
            <p className="text-sm">монет</p>
          </div>
        </div>
        <ol className="flex flex-col gap-4 leading-relaxed">
          <li>
            <strong>1. Предложите раздел.</strong> Решите, сколько оставить себе.
          </li>
          <li>
            <strong>2. Дождитесь ответа.</strong> Согласие — каждый получает свою долю. Отказ —
            обоим 0.
          </li>
          <li>
            <strong>3. Наберите больше монет.</strong> В игре каждый предлагает и отвечает на чужое
            предложение.
          </li>
        </ol>
        <Link className="text-link" to="/rules">
          Как устроена игра →
        </Link>
      </Parchment>
    </main>
  );
}
