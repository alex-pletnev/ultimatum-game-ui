import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from './App';

describe('App', () => {
  it('renders the title card', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /ultimatum/i })).toBeInTheDocument();
  });

  it('links to the style guide', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /style guide/i });
    expect(link).toHaveAttribute('href', '/_style-guide');
  });
});
