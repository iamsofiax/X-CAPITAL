"use client";

import { useEffect, useRef } from "react";
import { simAPI } from "@/lib/api";
import { useSim } from "@/hooks/useSim";

/** Publishes the user's season standing to the leaderboard at most once per epoch. */
export function useSimSync(): void {
  const { account, metrics, epoch, claimed } = useSim();
  const sentFor = useRef<string | null>(null);

  useEffect(() => {
    if (!account || !metrics || !claimed) return;
    const key = `${account.userId}:${epoch}:${account.resets}`;
    if (sentFor.current === key) return;
    sentFor.current = key;
    simAPI
      .submitSnapshot({
        season: account.season.index,
        nav: Math.round(metrics.nav * 100) / 100,
        seasonReturn: metrics.seasonReturn,
        sortino: metrics.sortino,
        maxDrawdown: metrics.maxDrawdown,
        careerTier: metrics.tier.title,
        xp: account.xp,
        resets: account.resets,
        epochs: metrics.seasonEpochs,
      })
      .catch(() => {
        sentFor.current = null;
      });
  }, [account, metrics, epoch, claimed]);
}
