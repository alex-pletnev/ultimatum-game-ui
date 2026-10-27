import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authStorage } from '../api/auth-storage';
import { apiFetch } from '../api/client';

export function RecoveryCode() {
  const [code, setCode] = useState(authStorage.getRecovery());
  const generate = useMutation({
    mutationFn: () => apiFetch<{ recoveryCode: string }>('/auth/recovery-code', { method: 'POST' }),
    onSuccess: (data) => {
      authStorage.setRecovery(data.recoveryCode);
      setCode(data.recoveryCode);
    },
  });
  return (
    <details className="page-container py-3">
      <summary className="text-link cursor-pointer">Код входа · сохраните для возвращения</summary>
      <div className="notice mt-3 flex flex-col gap-3">
        <p>
          Этот секретный код возвращает ваш профиль, игры и права ведущего с любого устройства.
          Сохраните его у себя и не передавайте другим участникам.
        </p>
        {code ? (
          <label className="flex flex-col gap-2">
            Ваш код восстановления
            <input
              className="w-full min-w-0 rounded border p-3 font-mono"
              readOnly
              value={code}
              onFocus={(e) => e.target.select()}
            />
          </label>
        ) : (
          <button
            className="button self-start"
            disabled={generate.isPending}
            onClick={() => generate.mutate()}
          >
            {generate.isPending ? 'Создаём…' : 'Получить код восстановления'}
          </button>
        )}
        {generate.isError && <p role="alert">Не удалось получить код. Повторите попытку.</p>}
      </div>
    </details>
  );
}
