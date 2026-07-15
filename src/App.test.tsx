import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';

function renderApp() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App (title card, not logged in)', () => {
  it('renders the title', () => {
    renderApp();
    expect(screen.getByRole('heading', { name: /ultimatum/i })).toBeInTheDocument();
  });

  it('CTA leads to /register', () => {
    renderApp();
    const cta = screen.getByRole('link', { name: /Присесть за стол/i });
    expect(cta).toHaveAttribute('href', '/register');
  });

  it('links to the style guide', () => {
    renderApp();
    const link = screen.getByRole('link', { name: /style guide/i });
    expect(link).toHaveAttribute('href', '/_style-guide');
  });
});
