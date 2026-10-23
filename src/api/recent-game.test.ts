import { readRecentGame, rememberGame } from './recent-game';

it('remembers a game per profile and tolerates corrupt storage', () => {
  rememberGame('alice', { id: 'game-1', name: 'Friday', finished: false });
  expect(readRecentGame('alice')).toEqual({ id: 'game-1', name: 'Friday', finished: false });
  expect(readRecentGame('bob')).toBeNull();
  localStorage.setItem('ug:recent:alice', '{broken');
  expect(readRecentGame('alice')).toBeNull();
});
