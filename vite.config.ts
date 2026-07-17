/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// В prod build уезжаем под project-page GH Pages — `/ultimatum-game-ui/`.
// В dev-сервер и Playwright ходят по `/`, иначе e2e ляжет.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ultimatum-game-ui/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules', 'dist'],
  },
}));
