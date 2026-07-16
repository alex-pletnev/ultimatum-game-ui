import { describe, expect, it } from 'vitest';
import {
  computeHistogram,
  computeLeaderboard,
  computeSummary,
  computeTimeline,
} from './Stats.aggregations';
import type { StatsRow } from '../api/stats-queries';

function row(overrides: Partial<StatsRow> = {}): StatsRow {
  return {
    offerId: 'o',
    roundNumber: 1,
    amount: 50,
    proposerId: 'p1',
    proposerNickname: 'p1',
    responderId: 'p2',
    responderNickname: 'p2',
    accepted: true,
    timestamp: '2026-07-16T10:00:00Z',
    ...overrides,
  };
}

describe('computeSummary', () => {
  it('пустой вход → нули', () => {
    const s = computeSummary([]);
    expect(s.totalOffers).toBe(0);
    expect(s.avgOffer).toBe(0);
    expect(s.acceptRate).toBe(0);
  });

  it('acceptRate считает только по решённым, avgOffer — по всем', () => {
    const rows = [
      row({ offerId: 'a', amount: 30, accepted: true }),
      row({ offerId: 'b', amount: 60, accepted: false }),
      row({ offerId: 'c', amount: 90, accepted: null }),
    ];
    const s = computeSummary(rows);
    expect(s.totalOffers).toBe(3);
    expect(s.totalDecisions).toBe(2);
    expect(s.avgOffer).toBe(60);
    expect(s.acceptRate).toBe(0.5);
    expect(s.mostGenerous).toBe(90);
    expect(s.mostGreedy).toBe(30);
  });
});

describe('computeLeaderboard', () => {
  it('accept → proposer roundSum-amount, responder amount; reject → 0', () => {
    const rows = [
      row({ proposerId: 'A', responderId: 'B', amount: 30, accepted: true }),
      row({ proposerId: 'B', responderId: 'A', amount: 70, accepted: false }),
    ];
    const board = computeLeaderboard(rows, 100);
    // Row1: A→B amount=30 accepted → A получает 70 (roundSum-amount), B получает 30.
    // Row2: B→A amount=70 rejected → оба по нулям.
    const a = board.find((p) => p.userId === 'A');
    const b = board.find((p) => p.userId === 'B');
    expect(a?.totalScore).toBe(70);
    expect(b?.totalScore).toBe(30);
    expect(a?.acceptRateAsResponder).toBe(0);   // A ответил на 1 offer'e (от B), отверг
    expect(b?.acceptRateAsResponder).toBe(1);   // B ответил на 1 (от A), принял
  });

  it('сортировка по убыванию totalScore', () => {
    const rows = [
      row({ proposerId: 'A', responderId: 'B', amount: 10, accepted: true }),
      row({ proposerId: 'C', responderId: 'B', amount: 50, accepted: true }),
    ];
    const board = computeLeaderboard(rows, 100);
    expect(board.map((p) => p.userId)).toEqual(['A', 'B', 'C']);
    // A: proposed 10, accepted → +90. B: got 10+50=60. C: proposed 50, accepted → +50.
    expect(board[0]?.totalScore).toBe(90);
  });
});

describe('computeHistogram', () => {
  it('раскладывает по бинам с step = roundSum/10 и различает accept/reject/pending', () => {
    const rows = [
      row({ amount: 5, accepted: true }),
      row({ amount: 15, accepted: false }),
      row({ amount: 95, accepted: null }),
    ];
    const bins = computeHistogram(rows, 100);
    // step=10 → bins: 0-9, 10-19, ..., 90-99, 100-100 (11 bins).
    expect(bins.length).toBeGreaterThanOrEqual(10);
    expect(bins[0]?.accepted).toBe(1);
    expect(bins[1]?.rejected).toBe(1);
    expect(bins[9]?.pending).toBe(1);
  });
});

describe('computeTimeline', () => {
  it('группирует по раунду и считает avg + acceptRate', () => {
    const rows = [
      row({ roundNumber: 1, amount: 40, accepted: true }),
      row({ roundNumber: 1, amount: 60, accepted: false }),
      row({ roundNumber: 2, amount: 50, accepted: true }),
    ];
    const t = computeTimeline(rows);
    expect(t).toEqual([
      { round: 1, avgOffer: 50, acceptRate: 50 },
      { round: 2, avgOffer: 50, acceptRate: 100 },
    ]);
  });
});
