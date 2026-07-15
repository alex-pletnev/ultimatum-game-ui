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

/* ────────────────────  Errors  ─────────────────── */

export type ApiErrorResponse = {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
};
