import type { User } from "@/types";

/** Merge live registry row into session user so admin updates apply immediately. */
export function mergeUserFromRegistry(
  sessionUser: User | null,
  registeredUsers: User[],
): User | null {
  if (!sessionUser) return null;

  const registry =
    registeredUsers.find((u) => u.id === sessionUser.id) ??
    registeredUsers.find(
      (u) => u.email.toLowerCase() === sessionUser.email.toLowerCase(),
    );

  if (!registry) return sessionUser;

  return {
    ...sessionUser,
    ...registry,
    // Keep session id stable if registry matched by email only
    id: sessionUser.id,
    email: sessionUser.email,
  };
}
