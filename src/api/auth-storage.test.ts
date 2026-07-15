import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authStorage } from './auth-storage';

describe('authStorage', () => {
  beforeEach(() => {
    authStorage.clear();
  });

  it('returns null when no tokens stored', () => {
    expect(authStorage.getAccess()).toBeNull();
    expect(authStorage.getRefresh()).toBeNull();
  });

  it('stores and returns both tokens', () => {
    authStorage.setTokens('access-1', 'refresh-1');
    expect(authStorage.getAccess()).toBe('access-1');
    expect(authStorage.getRefresh()).toBe('refresh-1');
  });

  it('keeps prior refresh when new refresh is null (rotation-off)', () => {
    authStorage.setTokens('access-1', 'refresh-1');
    authStorage.setTokens('access-2', null);
    expect(authStorage.getAccess()).toBe('access-2');
    expect(authStorage.getRefresh()).toBe('refresh-1');
  });

  it('clear() wipes both tokens', () => {
    authStorage.setTokens('access-1', 'refresh-1');
    authStorage.clear();
    expect(authStorage.getAccess()).toBeNull();
    expect(authStorage.getRefresh()).toBeNull();
  });

  it('subscribe() fires on setTokens and clear, and stops after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = authStorage.subscribe(listener);

    authStorage.setTokens('a', 'r');
    expect(listener).toHaveBeenCalledTimes(1);

    authStorage.clear();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    authStorage.setTokens('a2', 'r2');
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
