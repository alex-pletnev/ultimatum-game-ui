import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

/*
 * QueryClient factory с sensible defaults для игрового UI.
 *
 *  - retry: 3 для 5xx/network — prod backend Yandex.Cloud до ~30s стартует после ребута VM,
 *    первый запрос в session может увидеть 502 от Caddy. Три попытки с exp-backoff (~1s, ~2s, ~4s)
 *    покрывают cold-start без ручного reload'а.
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
          return failureCount < 3;
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
