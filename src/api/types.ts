/*
 * Types for backend of ultimatum-game (Kotlin/Spring Boot).
 * Первичный источник — docs/07-types.md. Здесь — то, что понадобится
 * в ближайшие задачи (auth + минимум для session). По мере нужды дополняем.
 */

/* ────────────────────  Enums  ─────────────────── */

export type Role = 'ADMIN' | 'PLAYER' | 'OBSERVER' | 'NPC';

/** Роли, доступные для регистрации/присвоения через API. NPC — только серверный резерв. */
export type AssignableRole = Exclude<Role, 'NPC'>;

export type SessionState = 'CREATED' | 'RUNNING' | 'FINISHED' | 'ABORTED';

export type SessionType = 'FREE_FOR_ALL' | 'TEAM_BATTLE';

export type RoundPhase =
  | 'CREATED'
  | 'WAIT_OFFERS'
  | 'ALL_OFFERS_RECEIVED'
  | 'OFFERS_SENT'
  | 'ALL_DECISIONS_RECEIVED'
  | 'FINISHED'
  | 'ABORTED';

export type MyRole = 'PROPOSER' | 'RESPONDER' | 'BOTH' | 'NONE';

/* ────────────────────  Auth  ──────────────────── */

export type CreateUserRequest = {
  nickname: string;
  role: AssignableRole;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type JwtAuthenticationResponse = {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
};

export type UserResponse = {
  id: string;
  nickname: string;
  role: Role;
  createdAt: string;
};

export type UserIdResponse = {
  id: string;
};

/* ────────────────────  Session — request DTO  ────────────────────────────── */

export type SessionConfigRequest = {
  sessionType: SessionType;
  numRounds: number;
  numTeams: number;
  numPlayers: number;
  roundSum: number;
  timeoutMoveSec: number;
};

export type CreateSessionRequest = {
  displayName: string;
  openToConnect?: boolean;
  config: SessionConfigRequest;
};

/* ────────────────────  Session (read-only минимум для лобби)  ────────────── */

export type SessionConfigResponse = {
  sessionType: SessionType;
  numRounds: number;
  numTeams: number;
  numPlayers: number;
  roundSum: number;
  timeoutMoveSec: number;
};

export type RoundPrewResponse = {
  id: string;
  roundNumber: number;
  roundPhase: RoundPhase;
};

export type TeamPrewResponse = {
  id: string;
  name: string;
  size: number;
};

export type SessionResponse = {
  id: string;
  displayName: string;
  state: SessionState;
  createdAt: string;
  admin: UserResponse;
  openToConnect: boolean;
  rounds: RoundPrewResponse[];
  config: SessionConfigResponse;
  teams: TeamPrewResponse[];
  currentRound: RoundPrewResponse | null;
};

/** Team с полными members'ами — для экрана /session/:id. */
export type TeamResponse = {
  id: string;
  name: string;
  members: UserResponse[];
};

/** Session с раскрытыми участниками. Возвращается `GET /session/{id}/with-teams-and-members` и `POST /session/{id}/join`. */
export type SessionWithTeamsAndMembersResponse = Omit<SessionResponse, 'teams'> & {
  teams: TeamResponse[];
  members: UserResponse[];
  observers: UserResponse[];
};

/* ────────────────────  Round + Offer + Decision  ─────────────────────────── */

export type OfferPrewResponse = {
  id: string;
  offerValue: number;
  proposer: UserResponse;
  responder: UserResponse | null;
  createdAt: string;
};

export type DecisionPrewResponse = {
  id: string;
  decision: boolean;
  responder: UserResponse;
  offer: OfferPrewResponse;
  createdAt: string;
};

export type PendingAction = {
  type: 'SEND_OFFER' | 'MAKE_DECISION';
  offerId?: string;
};

/** Session-preview без team-раскрытия, вложен в RoundResponse. */
export type SessionPrewResponse = {
  id: string;
  displayName: string;
  state: SessionState;
  createdAt: string;
  admin: UserResponse;
};

export type RoundResponse = {
  id: string;
  roundNumber: number;
  roundPhase: RoundPhase;
  offers: OfferPrewResponse[];
  decisions: DecisionPrewResponse[];
  session: SessionPrewResponse;
  /** Роль текущего user'а в раунде (backend вычисляет на REST-запросе; в WS-broadcast — NONE). */
  myRole: MyRole;
  myPendingActions: PendingAction[];
};

/* ────────────────────  STOMP-команды (SEND payloads)  ─────────────────────── */

/** Payload `/app/session/{id}/offer.create`. `amount ∈ [0, roundSum]`. */
export type CreateOfferCmd = {
  amount: number;
};

/** Payload `/app/session/{id}/make.decision`. */
export type MakeDecisionCmd = {
  offerId: string;
  decision: boolean;
};

/* ────────────────────  WS-события (payloads)  ─────────────────────────────── */

/** Payload `/topic/session/{id}/offerCreated`. Broadcast каждого нового оффера. */
export type OfferCreatedResponse = {
  id: string;
  round: RoundPrewResponse;
  proposer: UserResponse;
  responder: UserResponse | null;
  offerValue: number;
  createdAt: string;
};

/** Payload `/topic/session/{id}/decisionMade`. Broadcast каждого решения. */
export type DecisionMadeResponse = {
  id: string;
  round: RoundPrewResponse;
  responder: UserResponse;
  offer: OfferCreatedResponse;
  decision: boolean;
  createdAt: string;
};

/** Payload `/topic/session/{id}/offersShuffled`. Broadcast перехода в OFFERS_SENT. */
export type OffersShuffledResponse = {
  roundId: string;
  roundNumber: number;
  pairs: Array<{ offerId: string; proposerId: string; responderId: string }>;
};

/** Spring Data Page — минимальный набор полей, которые фронту нужны. */
export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

/* ────────────────────  Errors  ─────────────────── */

export type ApiErrorResponse = {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
};
