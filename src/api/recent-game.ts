type RecentGame = { id: string; name: string; finished: boolean };

export function readRecentGame(userId: string): RecentGame | null {
  try {
    const value = JSON.parse(
      localStorage.getItem(`ug:recent:${userId}`) ?? 'null',
    ) as RecentGame | null;
    return value &&
      typeof value.id === 'string' &&
      /^[a-zA-Z0-9-]+$/.test(value.id) &&
      typeof value.name === 'string' &&
      typeof value.finished === 'boolean'
      ? value
      : null;
  } catch {
    return null;
  }
}

export function rememberGame(userId: string, game: RecentGame): void {
  try {
    localStorage.setItem(`ug:recent:${userId}`, JSON.stringify(game));
  } catch {
    /* Resuming is optional when browser storage is unavailable. */
  }
}
