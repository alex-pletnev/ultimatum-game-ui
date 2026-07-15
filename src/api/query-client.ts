import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

/*
 * QueryClient factory с sensible defaults для игрового UI.
 *
 *  - retry: 1 — сеть флапает; но не долбим backend бесконечно.
 *  - retry не выполняется для 4xx (ошибка запроса, а не транзиента).
 *  - staleTime: 30s — минимизируем refetch'и при переходах между экранами.
 *  - refetchOnWindowFocus: false — навязчивое поведение в игре, где вкладка часто теряет focus.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 1;
        },
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
