import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Parchment } from '../components/Parchment';

export function Practice() {
  const [search] = useSearchParams();
  const requested = search.get('next');
  const next = requested?.match(/^\/session\/[a-zA-Z0-9-]+$/) ? requested : null;
  const entry = next ? `/register?next=${encodeURIComponent(next)}` : '/register';
  const [step, setStep] = useState<'offer' | 'offer-result' | 'decision' | 'result'>('offer');
  const [amount, setAmount] = useState(50);
  const [accepted, setAccepted] = useState(false);
  return (
    <main className="page-container max-w-2xl py-10">
      <div className="mb-6">
        <span className="eyebrow">Учебная игра · без регистрации</span>
        <h1 className="mt-2 text-3xl font-semibold">Попробуйте одну сделку</h1>
        <p className="mt-3 text-muted">
          Это пример с учебным ботом. Результат никуда не сохраняется.
        </p>
      </div>
      <Parchment className="flex flex-col gap-6">
        <ol aria-label="Шаги обучения" className="flex flex-wrap gap-2 text-sm">
          <li className="badge" aria-current={step.startsWith('offer') ? 'step' : undefined}>
            1. Предложите
          </li>
          <li className="badge" aria-current={step === 'decision' ? 'step' : undefined}>
            2. Ответьте
          </li>
          <li className="badge" aria-current={step === 'result' ? 'step' : undefined}>
            3. Готово
          </li>
        </ol>
        {step === 'offer' && (
          <>
            <h2 className="text-2xl font-semibold">Как разделим 100 монет?</h2>
            <p>
              Предложите боту часть суммы. Он согласится на 30 монет или больше. У живых игроков
              свои представления о справедливости.
            </p>
            <div className="split-preview">
              <div>
                Вам<strong>{100 - amount}</strong>
              </div>
              <div>
                Боту<strong>{amount}</strong>
              </div>
            </div>
            <label className="flex flex-col gap-3">
              Монет боту
              <input
                type="range"
                min="0"
                max="100"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </label>
            <button className="button" onClick={() => setStep('offer-result')}>
              Предложить {amount} монет
            </button>
          </>
        )}
        {step === 'offer-result' && (
          <div className="flex flex-col gap-5" role="status">
            <h2 className="text-2xl font-semibold">
              {amount >= 30 ? 'Бот согласился' : 'Бот отклонил предложение'}
            </h2>
            <p>
              {amount >= 30
                ? `Вы получили ${100 - amount} монет, бот — ${amount}. Договориться выгодно обоим.`
                : 'Оба получили 0 монет. Даже выгодное вам предложение ничего не принесёт, если его отклонят.'}
            </p>
            <button className="button" onClick={() => setStep('decision')}>
              Теперь ваш ответ →
            </button>
          </div>
        )}
        {step === 'decision' && (
          <>
            <h2 className="text-2xl font-semibold">Бот предлагает вам 40 монет</h2>
            <p>Себе он оставляет 60. Вас устраивает такой раздел?</p>
            <div className="split-preview">
              <div>
                Вам<strong>40</strong>
              </div>
              <div>
                Боту<strong>60</strong>
              </div>
            </div>
            <p className="text-sm text-muted">Примете — получите 40. Отклоните — оба получите 0.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                className="button"
                onClick={() => {
                  setAccepted(true);
                  setStep('result');
                }}
              >
                Принять · получить 40
              </button>
              <button
                className="button button-secondary"
                onClick={() => {
                  setAccepted(false);
                  setStep('result');
                }}
              >
                Отклонить · обоим 0
              </button>
            </div>
          </>
        )}
        {step === 'result' && (
          <div className="flex flex-col gap-5" role="status">
            <h2 className="text-2xl font-semibold">Теперь вы знаете правила</h2>
            <p>
              {accepted
                ? 'Вы получили 40 монет, бот — 60.'
                : 'Оба получили 0 монет. Вы отказались от этого раздела.'}
            </p>
            <p>
              В общей игре каждый предлагает раздел, а затем отвечает на предложение другого игрока.
              После всех ответов начисляются очки и начинается следующий раунд.
            </p>
            <Link className="button" to={entry}>
              К игре с друзьями
            </Link>
            <button
              className="button button-secondary"
              onClick={() => {
                setAmount(50);
                setStep('offer');
              }}
            >
              Попробовать ещё
            </button>
          </div>
        )}
      </Parchment>
      <Link className="text-link mt-6 inline-block" to={entry}>
        Пропустить обучение и перейти к игре →
      </Link>
    </main>
  );
}
