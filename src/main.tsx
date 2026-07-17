import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatedRoutes } from './AnimatedRoutes';
import { createQueryClient } from './api/query-client';
import { StompProvider } from './api/ws/StompProvider';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const queryClient = createQueryClient();

const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <StompProvider>
        {/* Prod → HashRouter: GH Pages не умеет SPA-fallback без хака в 404.html.
            Dev/e2e → BrowserRouter: чистые URL для Playwright-goto. */}
        <Router>
          <AnimatedRoutes />
        </Router>
      </StompProvider>
    </QueryClientProvider>
  </StrictMode>,
);
