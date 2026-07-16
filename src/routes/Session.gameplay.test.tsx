import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Client } from '@stomp/stompjs';
import { StompContext } from '../api/ws/stomp-context';
import { OfferPhasePanel, DecisionPhasePanel } from './Session';
import type { RoundResponse, UserResponse } from '../api/types';

function wrapWithClient(publish: ReturnType<typeof vi.fn>) {
  const client = { connected: true, publish } as unknown as Client;
  return ({ children }: { children: React.ReactNode }) => (
    <StompContext.Provider value={{ client, connected: true }}>{children}</StompContext.Provider>
  );
}

const user = (id: string, nickname: string): UserResponse => ({
  id,
  nickname,
  role: 'PLAYER',
  createdAt: '2026-07-16T10:00:00Z',
});

const baseRound = (
  overrides: Partial<RoundResponse> = {},
): RoundResponse => ({
  id: 'r-1',
  roundNumber: 1,
  roundPhase: 'WAIT_OFFERS',
  offers: [],
  decisions: [],
  session: {
    id: 's-1',
    displayName: 'X',
    state: 'RUNNING',
    createdAt: '2026-07-16T10:00:00Z',
    admin: user('a-1', 'admin'),
  },
  myRole: 'BOTH',
  myPendingActions: [{ type: 'SEND_OFFER' }],
  ...overrides,
});

describe('OfferPhasePanel', () => {
  it('renders slider + submit при pending SEND_OFFER; клик публикует amount', () => {
    const publish = vi.fn();
    render(
      <OfferPhasePanel
        sessionId="s-1"
        round={baseRound()}
        roundSum={100}
        playersCount={2}
        liveConnected
      />,
      { wrapper: wrapWithClient(publish) },
    );

    // Слайдер должен быть с дефолтом 50.
    const slider = screen.getByLabelText(/Сумма предложения/i) as HTMLInputElement;
    expect(slider.value).toBe('50');

    fireEvent.change(slider, { target: { value: '70' } });
    fireEvent.click(screen.getByRole('button', { name: /Огласить сделку/i }));

    expect(publish).toHaveBeenCalledWith({
      destination: '/app/session/s-1/offer.create',
      body: '{"amount":70}',
    });
  });

  it('без SEND_OFFER показывает waiting-текст с progress', () => {
    render(
      <OfferPhasePanel
        sessionId="s-1"
        round={baseRound({
          myPendingActions: [],
          offers: [
            {
              id: 'o-1',
              offerValue: 40,
              proposer: user('u-1', 'me'),
              responder: null,
              createdAt: '2026-07-16T10:00:00Z',
            },
          ],
        })}
        roundSum={100}
        playersCount={3}
        liveConnected
      />,
      { wrapper: wrapWithClient(vi.fn()) },
    );

    expect(screen.getByText(/предложение занесено/i)).toBeInTheDocument();
    expect(screen.getByText(/Собрано 1 \/ 3/i)).toBeInTheDocument();
  });
});

describe('DecisionPhasePanel', () => {
  it('рендерит accept/reject и публикует decision при клике', () => {
    const publish = vi.fn();
    const offer = {
      id: 'o-42',
      offerValue: 30,
      proposer: user('p-1', 'proposer1'),
      responder: user('me', 'me'),
      createdAt: '2026-07-16T10:00:00Z',
    };
    render(
      <DecisionPhasePanel
        sessionId="s-1"
        round={baseRound({
          roundPhase: 'OFFERS_SENT',
          offers: [offer],
          myPendingActions: [{ type: 'MAKE_DECISION', offerId: 'o-42' }],
        })}
        roundSum={100}
        playersCount={2}
        liveConnected
      />,
      { wrapper: wrapWithClient(publish) },
    );

    expect(screen.getByText(/proposer1/i)).toBeInTheDocument();
    expect(screen.getByText(/30/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Согласиться/i }));

    expect(publish).toHaveBeenCalledWith({
      destination: '/app/session/s-1/make.decision',
      body: '{"offerId":"o-42","decision":true}',
    });
  });

  it('reject-кнопка публикует decision=false', () => {
    const publish = vi.fn();
    render(
      <DecisionPhasePanel
        sessionId="s-1"
        round={baseRound({
          roundPhase: 'OFFERS_SENT',
          offers: [
            {
              id: 'o-99',
              offerValue: 10,
              proposer: user('p-1', 'proposer1'),
              responder: user('me', 'me'),
              createdAt: '2026-07-16T10:00:00Z',
            },
          ],
          myPendingActions: [{ type: 'MAKE_DECISION', offerId: 'o-99' }],
        })}
        roundSum={100}
        playersCount={2}
        liveConnected
      />,
      { wrapper: wrapWithClient(publish) },
    );

    fireEvent.click(screen.getByRole('button', { name: /Разбить сделку/i }));

    expect(publish).toHaveBeenCalledWith({
      destination: '/app/session/s-1/make.decision',
      body: '{"offerId":"o-99","decision":false}',
    });
  });

  it('без MAKE_DECISION показывает waiting с progress', () => {
    render(
      <DecisionPhasePanel
        sessionId="s-1"
        round={baseRound({
          roundPhase: 'OFFERS_SENT',
          offers: [],
          decisions: [
            {
              id: 'd-1',
              decision: true,
              responder: user('me', 'me'),
              offer: {
                id: 'o-1',
                offerValue: 50,
                proposer: user('p-1', 'p1'),
                responder: user('me', 'me'),
                createdAt: '2026-07-16T10:00:00Z',
              },
              createdAt: '2026-07-16T10:00:00Z',
            },
          ],
          myPendingActions: [],
        })}
        roundSum={100}
        playersCount={4}
        liveConnected
      />,
      { wrapper: wrapWithClient(vi.fn()) },
    );

    expect(screen.getByText(/Твой ответ занесён/i)).toBeInTheDocument();
    expect(screen.getByText(/Решено 1 \/ 4/i)).toBeInTheDocument();
  });
});
