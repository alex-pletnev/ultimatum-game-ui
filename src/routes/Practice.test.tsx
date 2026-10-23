import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { Practice } from './Practice';

it('teaches both decisions, calculates payoffs and starts over without an account', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Practice />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByRole('slider'), { target: { value: '40' } });
  await user.click(screen.getByRole('button', { name: /Предложить 40/ }));
  expect(screen.getByText(/Вы получили 60/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Теперь ваш ответ/ }));
  await user.click(screen.getByRole('button', { name: /Отклонить/ }));
  expect(screen.getByText(/Оба получили 0/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Попробовать ещё/ }));
  expect(screen.getByRole('slider')).toHaveValue('50');
});

it('explains rejection of a low offer and acceptance of the partner offer', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Practice />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByRole('slider'), { target: { value: '10' } });
  await user.click(screen.getByRole('button', { name: /Предложить 10/ }));
  expect(screen.getByText(/Бот отклонил/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Теперь ваш ответ/ }));
  await user.click(screen.getByRole('button', { name: /Принять/ }));
  expect(screen.getByText(/Вы получили 40/)).toBeInTheDocument();
});

it('preserves an invitation when skipping the tutorial', () => {
  render(
    <MemoryRouter initialEntries={['/practice?next=%2Fsession%2Fgame-1']}>
      <Practice />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: /Пропустить обучение/ })).toHaveAttribute(
    'href',
    '/register?next=%2Fsession%2Fgame-1',
  );
});
