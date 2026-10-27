import { afterEach, expect, it, vi } from 'vitest';
import { createStompClient } from './stomp-client';
import { authStorage } from '../auth-storage';

vi.mock('../client', () => ({ refreshAccessToken: vi.fn(async () => 'renewed') }));

afterEach(() => authStorage.clear());

it('uses the current token before every connection, including reconnects', async () => {
  authStorage.setTokens('current-access', 'refresh');
  const client = createStompClient('old-access');
  await client.beforeConnect(client);
  expect(client.connectHeaders.Authorization).toBe('Bearer current-access');
  authStorage.setTokens('next-access', 'refresh');
  await client.beforeConnect(client);
  expect(client.connectHeaders.Authorization).toBe('Bearer next-access');
});
