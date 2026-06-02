"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { mergeUserFromRegistry } from "@/lib/mergeSessionUser";

/** Session user merged with admin registry (balance, KYC, unlocked rails). */
export function useSessionUser() {
  const user = useStore((s) => s.user);
  const registeredUsers = useStore((s) => s.registeredUsers);

  return useMemo(
    () => mergeUserFromRegistry(user, registeredUsers),
    [user, registeredUsers],
  );
}
