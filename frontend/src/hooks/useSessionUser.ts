"use client";

import { useStore } from "@/store/useStore";

export function useSessionUser() {
  return useStore((s) => s.user);
}
