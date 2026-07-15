import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { authStorage, useAccessToken } from './auth-storage';
import type {
  CreateUserRequest,
  JwtAuthenticationResponse,
  UserResponse,
} from './types';

export const authKeys = {
  user: ['auth', 'user'] as const,
};

/** Профиль текущего пользователя. Enabled только при наличии access-токена. */
export function useCurrentUser() {
  const token = useAccessToken();
  return useQuery({
    queryKey: authKeys.user,
    queryFn: () => apiFetch<UserResponse>('/user'),
    enabled: token !== null,
  });
}

/** Регистрация нового игрока. При успехе — сохраняет токены и инвалидирует профиль. */
export function useQuickRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserRequest) =>
      apiFetch<JwtAuthenticationResponse>('/auth/quick-register', {
        method: 'POST',
        body,
      }),
    onSuccess: (data) => {
      authStorage.setTokens(data.accessToken, data.refreshToken);
      void qc.invalidateQueries({ queryKey: authKeys.user });
    },
  });
}

/** Разлогин. Отзывает токен на backend'е и чистит локальный state (даже при ошибке). */
export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      authStorage.clear();
      qc.clear();
    },
  });
}
