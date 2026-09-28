"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";
import { readPersistedAuth, scopeFromPath, type DeskScope } from "@/lib/sessionScope";

/** Swaps the in-memory session when the path crosses between the desk and the admin ground station. */
export default function SessionScope() {
  const pathname = usePathname();
  const seen = useRef<DeskScope | null>(null);

  useLayoutEffect(() => {
    const scope = scopeFromPath(pathname || "/");
    if (seen.current === scope) return;
    const first = seen.current === null;
    seen.current = scope;
    if (first) return;
    const saved = readPersistedAuth(scope);
    useStore.setState({
      user: (saved?.user as ReturnType<typeof useStore.getState>["user"]) ?? null,
      accessToken: saved?.accessToken ?? null,
      refreshToken: saved?.refreshToken ?? null,
      isAuthenticated: !!saved?.isAuthenticated && !!saved?.user,
    });
  }, [pathname]);

  return null;
}
