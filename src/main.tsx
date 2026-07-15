import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { CreateSession } from './routes/CreateSession';
import { Lobby } from './routes/Lobby';
import { Register } from './routes/Register';
import { Session } from './routes/Session';
import { StyleGuide } from './routes/StyleGuide';
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
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/register" element={<Register />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/lobby/new" element={<CreateSession />} />
            <Route path="/session/:id" element={<Session />} />
            <Route path="/_style-guide" element={<StyleGuide />} />
          </Routes>
        </BrowserRouter>
      </StompProvider>
    </QueryClientProvider>
  </StrictMode>,
);
