import type { StatsRow } from '../api/stats-queries';

export type Summary = {
  totalRounds: number;
  totalOffers: number;
  totalDecisions: number;
  avgOffer: number;
  acceptRate: number;
  mostGenerous: number;
  mostGreedy: number;
};

export function computeSummary(rows: StatsRow[]): Summary {
  const totalOffers = rows.length;
  if (totalOffers === 0) {
    return {
      totalRounds: 0,
      totalOffers: 0,
      totalDecisions: 0,
      avgOffer: 0,
      acceptRate: 0,
      mostGenerous: 0,
      mostGreedy: 0,
    };
  }
  const amounts = rows.map((r) => r.amount);
  const decided = rows.filter((r) => r.accepted !== null);
  const accepted = decided.filter((r) => r.accepted === true).length;
  return {
    totalRounds: new Set(rows.map((r) => r.roundNumber)).size,
    totalOffers,
    totalDecisions: decided.length,
    avgOffer: amounts.reduce((s, a) => s + a, 0) / totalOffers,
    acceptRate: decided.length === 0 ? 0 : accepted / decided.length,
    mostGenerous: Math.max(...amounts),
    mostGreedy: Math.min(...amounts),
  };
}

export type PlayerRow = {
  userId: string;
  nickname: string;
  totalScore: number;
  offersMade: number;
  avgProposed: number;
  offersReceived: number;
  acceptRateAsResponder: number;
};

export function computeLeaderboard(rows: StatsRow[], roundSum: number): PlayerRow[] {
  const map = new Map<string, PlayerRow>();
  const ensure = (id: string, nickname: string): PlayerRow => {
    const existing = map.get(id);
    if (existing !== undefined) return existing;
    const created: PlayerRow = {
      userId: id,
      nickname,
      totalScore: 0,
      offersMade: 0,
      avgProposed: 0,
      offersReceived: 0,
      acceptRateAsResponder: 0,
    };
    map.set(id, created);
    return created;
  };

  const proposedSum = new Map<string, number>();
  const acceptedAsResponder = new Map<string, number>();
  const respondedCount = new Map<string, number>();

  for (const r of rows) {
    const pr = ensure(r.proposerId, r.proposerNickname);
    pr.offersMade++;
    proposedSum.set(r.proposerId, (proposedSum.get(r.proposerId) ?? 0) + r.amount);

    const rp = ensure(r.responderId, r.responderNickname);
    rp.offersReceived++;

    if (r.accepted === true) {
      pr.totalScore += roundSum - r.amount;
      rp.totalScore += r.amount;
    }
    if (r.accepted !== null) {
      respondedCount.set(r.responderId, (respondedCount.get(r.responderId) ?? 0) + 1);
      if (r.accepted === true) {
        acceptedAsResponder.set(
          r.responderId,
          (acceptedAsResponder.get(r.responderId) ?? 0) + 1,
        );
      }
    }
  }

  for (const [id, p] of map) {
    p.avgProposed = p.offersMade === 0 ? 0 : (proposedSum.get(id) ?? 0) / p.offersMade;
    const total = respondedCount.get(id) ?? 0;
    const acc = acceptedAsResponder.get(id) ?? 0;
    p.acceptRateAsResponder = total === 0 ? 0 : acc / total;
  }

  return [...map.values()].sort((a, b) => b.totalScore - a.totalScore);
}

export type HistogramBin = {
  label: string;
  accepted: number;
  rejected: number;
  pending: number;
};

export function computeHistogram(rows: StatsRow[], roundSum: number): HistogramBin[] {
  const step = Math.max(1, Math.round(roundSum / 10));
  const bins: HistogramBin[] = [];
  for (let start = 0; start <= roundSum; start += step) {
    const end = Math.min(start + step - 1, roundSum);
    bins.push({ label: `${start}-${end}`, accepted: 0, rejected: 0, pending: 0 });
  }
  for (const r of rows) {
    const idx = Math.min(Math.floor(r.amount / step), bins.length - 1);
    const bin = bins[idx];
    if (bin === undefined) continue;
    if (r.accepted === true) bin.accepted++;
    else if (r.accepted === false) bin.rejected++;
    else bin.pending++;
  }
  return bins;
}

export type TimelinePoint = {
  round: number;
  avgOffer: number;
  acceptRate: number;
};

export function computeTimeline(rows: StatsRow[]): TimelinePoint[] {
  const perRound = new Map<number, StatsRow[]>();
  for (const r of rows) {
    const arr = perRound.get(r.roundNumber) ?? [];
    arr.push(r);
    perRound.set(r.roundNumber, arr);
  }
  return [...perRound.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([round, subset]) => {
      const decided = subset.filter((r) => r.accepted !== null);
      const accepted = decided.filter((r) => r.accepted === true).length;
      return {
        round,
        avgOffer: subset.reduce((s, r) => s + r.amount, 0) / subset.length,
        acceptRate: decided.length === 0 ? 0 : (accepted / decided.length) * 100,
      };
    });
}
