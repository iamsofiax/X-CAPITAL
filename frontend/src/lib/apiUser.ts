import type { User, KYCStatus, UserTier, UserRole } from "@/types";

import { isLocalToken } from "@/lib/localDesk";

export function hasApiToken(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("xc_access_token");
  return !!token && token.split(".").length === 3 && !isLocalToken(token);
}

export function hasSessionToken(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("xc_access_token");
  return hasApiToken() || isLocalToken(token);
}

function mapKycStatus(status: string): KYCStatus {
  if (status === "VERIFIED") return "APPROVED";
  return status as KYCStatus;
}

function mapRole(role: string | undefined): UserRole {
  return role === "ADMIN" || role === "GOD_ADMIN" ? "GOD_ADMIN" : "USER";
}

export function isAdminUser(user: Pick<User, "role"> | null | undefined): boolean {
  return user?.role === "GOD_ADMIN" || user?.role === "ADMIN";
}

/** Row returned by GET /admin/users. */
export type AdminUserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  tier: string;
  kycStatus: string;
  accreditationStatus: string;
  role: "ADMIN" | "USER";
  avatarUrl?: string | null;
  authProvider?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  simSnapshot?: {
    nav: string | number;
    sortino: string | number | null;
    careerTier: string;
    resets: number;
    updatedAt: string;
  } | null;
};

export function mapAuthLoginUser(
  apiUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tier: string;
    kycStatus: string;
    accreditationStatus?: string;
    role?: string;
    avatarUrl?: string | null;
    authProvider?: string;
    phone?: string | null;
    createdAt?: string;
  },
): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    phone: apiUser.phone ?? undefined,
    profilePicture: apiUser.avatarUrl ?? undefined,
    authProvider: apiUser.authProvider,
    role: mapRole(apiUser.role),
    tier: apiUser.tier as UserTier,
    kycStatus: mapKycStatus(apiUser.kycStatus),
    accreditationStatus:
      (apiUser.accreditationStatus as User["accreditationStatus"]) ?? "NOT_ACCREDITED",
    createdAt: apiUser.createdAt ?? new Date().toISOString(),
  };
}
