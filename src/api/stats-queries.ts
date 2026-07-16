import { useQuery } from '@tanstack/react-query';
import { apiFetchText } from './client';
import { useAccessToken } from './auth-storage';
import { parseCsv } from './csv';

/*
 * Одна строка CSV = один оффер + (если сделан) его decision.
 * Колонки backend'а (docs/05-api.md §5):
 *   offerId, roundNumber, amount, proposerId, proposerNickname,
 *   responderId, responderNickname, accepted, timestamp
 * accepted: "true" | "false" | "" (нет ответа — round abort'нут).
 */
export type StatsRow = {
  offerId: string;
  roundNumber: number;
  amount: number;
  proposerId: string;
  proposerNickname: string;
  responderId: string;
  responderNickname: string;
  /** null — оффер не получил решения (round abort). */
  accepted: boolean | null;
  timestamp: string;
};

export const statsKeys = {
  all: ['stats'] as const,
  session: (id: string) => ['stats', 'session', id] as const,
};

function toRow(raw: Record<string, string>): StatsRow {
  const acceptedRaw = raw.accepted?.trim().toLowerCase();
  const accepted =
    acceptedRaw === 'true' ? true : acceptedRaw === 'false' ? false : null;
  return {
    offerId: raw.offerId ?? '',
    roundNumber: Number(raw.roundNumber ?? 0),
    amount: Number(raw.amount ?? 0),
    proposerId: raw.proposerId ?? '',
    proposerNickname: raw.proposerNickname ?? '',
    responderId: raw.responderId ?? '',
    responderNickname: raw.responderNickname ?? '',
    accepted,
    timestamp: raw.timestamp ?? '',
  };
}

/**
 * Загружает и парсит CSV статистики партии.
 * Пустая партия (0 офферов) вернёт пустой массив — не ошибка.
 */
export function useSessionStats(id: string | undefined) {
  const token = useAccessToken();
  return useQuery<StatsRow[]>({
    queryKey: statsKeys.session(id ?? ''),
    queryFn: async () => {
      const csv = await apiFetchText(
        `/statistics/${encodeURIComponent(id ?? '')}/csv`,
      );
      return parseCsv(csv).map(toRow);
    },
    enabled: token !== null && id !== undefined && id.length > 0,
    staleTime: 5_000,
  });
}
