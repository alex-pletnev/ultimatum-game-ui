import { defineConfig, devices } from '@playwright/test';

/*
 * Backend (Kotlin/Spring Boot) должен быть поднят руками на localhost:8080
 * до `pnpm test:e2e`. Playwright автоматически поднимает только Vite dev-сервер
 * (frontend). Backend не автоматизируем — зависит от JAVA_HOME / Docker / Postgres.
 */

const BASE_URL = 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Shared backend (один Kotlin/Spring instance на все workers) даёт racы под нагрузкой:
  // POST /session → invalidate + refetch GET /session может отстать. workers=1 — sequential
  // прогон, стабильный. Локально e2e и так быстрый (~10-60s), задача на CI можно вернуть 2.
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
