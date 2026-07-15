/*
 * Runtime-конфиг, собранный из VITE_*-переменных окружения.
 * Пропущенная переменная — ошибка на старте (лучше, чем скрытая 404 в консоли).
 */

function requireEnv(name: string): string {
  const value = import.meta.env[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      `Env variable ${name} is not set. Скопируй .env.example → .env.local и заполни значения.`,
    );
  }
  return value;
}

export const config = {
  apiBaseUrl: requireEnv('VITE_API_BASE_URL'),
  wsUrl: requireEnv('VITE_WS_URL'),
};
