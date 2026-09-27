// ─────────────────────────────────────────────────────────────────────────────
// X-CAPITAL — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

export type UserTier = "CORE" | "GOLD" | "BLACK";
export type UserRole = "USER" | "ADMIN" | "GOD_ADMIN";
export type KYCStatus = "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED";
export type AccreditationStatus = "NOT_ACCREDITED" | "PENDING" | "ACCREDITED";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  role?: UserRole;
  tier: UserTier;
  kycStatus: KYCStatus;
  accreditationStatus: AccreditationStatus;
  createdAt: string;
  authProvider?: string;
  lastLogin?: string;
}

export interface Bar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ msg: string; path: string }>;
}
