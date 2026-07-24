import type { User, Wallet } from "@/types";
import { mergeUserFromRegistry } from "@/lib/mergeSessionUser";

export function resolveFiatBalance(
  wallet: Wallet | null | undefined,
  user: User | null | undefined,
): number {
  const w = Number(wallet?.fiatBalance);
  const u = Number(user?.balance);
  const walletBal = Number.isFinite(w) ? w : 0;
  const userBal = Number.isFinite(u) ? u : 0;
  return Math.max(walletBal, userBal);
}

export function matchesAccount(
  u: User,
  userId: string,
  userEmail?: string,
): boolean {
  if (u.id === userId) return true;
  if (userEmail && u.email.toLowerCase() === userEmail.toLowerCase()) return true;
  return false;
}

export function matchesSessionUser(
  sessionUser: User | null,
  userId: string,
  userEmail?: string,
): boolean {
  if (!sessionUser) return false;
  return matchesAccount(sessionUser, userId, userEmail);
}

/** Apply a definitive balance for one account across registry + active session. */
export function patchBalanceForUser(
  state: {
    user: User | null;
    registeredUsers: User[];
    wallet: Wallet | null;
  },
  userId: string,
  userEmail: string,
  newBalance: number,
) {
  const balance = Math.max(0, newBalance);
  const registeredUsers = state.registeredUsers.map((u) =>
    matchesAccount(u, userId, userEmail) ? { ...u, balance } : u,
  );

  const sessionMatches = matchesSessionUser(state.user, userId, userEmail);
  const user =
    sessionMatches && state.user
      ? mergeUserFromRegistry(
          { ...state.user, balance },
          registeredUsers,
        )
      : state.user;

  const wallet: Wallet | null =
    sessionMatches && state.user
      ? {
          id: state.wallet?.id ?? `wallet-${state.user.id}`,
          fiatBalance: balance,
          cryptoBalance: Number(state.wallet?.cryptoBalance ?? 0),
          lockedBalance: Number(state.wallet?.lockedBalance ?? 0),
        }
      : state.wallet;

  return { registeredUsers, user, wallet };
}

/** Credit or debit one account by delta. */
export function patchBalanceDelta(
  state: {
    user: User | null;
    registeredUsers: User[];
    wallet: Wallet | null;
  },
  userId: string,
  userEmail: string,
  delta: number,
) {
  const row =
    state.registeredUsers.find((u) => matchesAccount(u, userId, userEmail)) ??
    (state.user && matchesSessionUser(state.user, userId, userEmail)
      ? state.user
      : null);
  const current = Number(
    row?.balance ?? state.wallet?.fiatBalance ?? state.user?.balance ?? 0,
  );
  return patchBalanceForUser(
    state,
    userId,
    userEmail,
    Math.max(0, current + delta),
  );
}
