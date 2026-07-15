import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

/*
 * Node 22+ и jsdom 25 совместно предоставляют неработающий localStorage
 * (Node подсовывает свой experimental Web Storage без флага `--localstorage-file`,
 * jsdom его не перезаписывает). Ставим свой in-memory Storage — предсказуемо и быстро.
 */

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

const localStorageInstance = new MemoryStorage();
const sessionStorageInstance = new MemoryStorage();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageInstance,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageInstance,
  writable: true,
  configurable: true,
});
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageInstance,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageInstance,
    writable: true,
    configurable: true,
  });
}

beforeEach(() => {
  localStorageInstance.clear();
  sessionStorageInstance.clear();
});
