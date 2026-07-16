import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatedRoutes } from './AnimatedRoutes';
import { createQueryClient } from './api/query-client';
import { StompProvider } from './api/ws/StompProvider';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const queryClient = createQueryClient();

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <StompProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </StompProvider>
    </QueryClientProvider>
  </StrictMode>,
);
