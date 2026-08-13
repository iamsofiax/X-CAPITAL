/**
 * ────────────────────────────────────────────────────────────────────────────
 * nodeLadder — ADMIN-DRIVEN NODE ADVANCEMENT LADDER
 *
 * The single source of truth for the "node → node" progression every user
 * climbs. The admin (Ground Station) controls each user's funding goal and
 * the daily rate they unlock by reaching it. Users see a relentless ladder:
 *
 *   Fund Node II ($500)  → daily rate bumps 3.0% → 3.5%
 *   Fund Node III ($2k)  → bumps to 5.0%
 *   ... up to Node VIII (Sovereign) at 15%/day.
 *
 * Every dashboard readout, growth engine tick, and projection derives from
 * the SAME structure below so the admin's node goals and unlocked rates are
 * respected end-to-end.
 *
 * GROUND STATION RULE: If the admin set `nodeGoal` + `nextNodeRate` on a
 * user, those values GOVERN that user's ladder (their path is entirely
 * admin-shaped). Otherwise the default ladder below applies.
 * ────────────────────────────────────────────────────────────────────────────
 */
import type { User } from "@/types";

export interface NodeTierConfig {
  tier: number; // 1..8
  code: string; // "NODE-I"
  label: string; // "Node I — Core"
  shortLabel: string; // "NODE I"
  fundingGoal: number; // balance required to ACTIVATE this node's rate
  dailyRatePct: number; // daily rate unlocked at this node
  color: string; // tailwind text color
  descriptor: string; // one-line behavioral hook
}

/** Default institutional ladder — compelling, staged, believable. */
export const NODE_LADDER: NodeTierConfig[] = [
  {
    tier: 1,
    code: "NODE-I",
    label: "Node I — Core",
    shortLabel: "NODE I",
    fundingGoal: 0,
    dailyRatePct: 3.0,
    color: "text-white/60",
    descriptor: "Onboarding tier — base compounding active",
  },
  {
    tier: 2,
    code: "NODE-II",
    label: "Node II — Growth",
    shortLabel: "NODE II",
    fundingGoal: 500,
    dailyRatePct: 3.5,
    color: "text-sky-400",
    descriptor: "Fund $500 to unlock +0.5% daily",
  },
  {
    tier: 3,
    code: "NODE-III",
    label: "Node III — Momentum",
    shortLabel: "NODE III",
    fundingGoal: 2_000,
    dailyRatePct: 5.0,
    color: "text-emerald-400",
    descriptor: "Fund $2,000 to unlock +1.5% daily",
  },
  {
    tier: 4,
    code: "NODE-IV",
    label: "Node IV — Accelerator",
    shortLabel: "NODE IV",
    fundingGoal: 5_000,
    dailyRatePct: 6.5,
    color: "text-cyan-400",
    descriptor: "Fund $5,000 to unlock +1.5% daily",
  },
  {
    tier: 5,
    code: "NODE-V",
    label: "Node V — Compound Engine",
    shortLabel: "NODE V",
    fundingGoal: 12_500,
    dailyRatePct: 8.0,
    color: "text-amber-400",
    descriptor: "Fund $12,500 to unlock 8%/day",
  },
  {
    tier: 6,
    code: "NODE-VI",
    label: "Node VI — Velocity",
    shortLabel: "NODE VI",
    fundingGoal: 25_000,
    dailyRatePct: 10.0,
    color: "text-orange-400",
    descriptor: "Fund $25,000 to unlock 10%/day",
  },
  {
    tier: 7,
    code: "NODE-VII",
    label: "Node VII — Institutional",
    shortLabel: "NODE VII",
    fundingGoal: 60_000,
    dailyRatePct: 12.5,
    color: "text-purple-400",
    descriptor: "Fund $60,000 to unlock 12.5%/day",
  },
  {
    tier: 8,
    code: "NODE-VIII",
    label: "Node VIII — Sovereign",
    shortLabel: "NODE VIII",
    fundingGoal: 150_000,
    dailyRatePct: 15.0,
    color: "text-emerald-300",
    descriptor: "Fund $150,000 to unlock 15%/day — max tier",
  },
];

/** Absolute ceiling the engine will ever apply before clamping (~2× ladder max). */
export const LADDER_MAX_RATE_PCT = 15.0;

/**
 * Resolve the tier the user currently HOLDS.
 *
 * Admin override semantics:
 *  - `user.nodeGoal` + `user.nextNodeRate`: the admin's exact milestone.
 *    While balance < nodeGoal → user's CURRENT rate comes from their current
 *    tier (ladder default or previous admin milestone). Once balance >=
 *    nodeGoal → they hold nodeTier+1 at nextNodeRate.
 *  - Otherwise the default ladder floor applies: highest node whose
 *    fundingGoal <= balance.
 */
export function resolveCurrentNode(
  balance: number,
  user?: Partial<User> | null,
): NodeTierConfig {
  const bal = Math.max(0, Number(balance) || 0);

  // Admin milestone reached → advance to the next node at admin rate.
  if (
    user &&
    typeof user.nodeGoal === "number" &&
    user.nodeGoal > 0 &&
    typeof user.nextNodeRate === "number" &&
    user.nextNodeRate > 0
  ) {
    if (bal >= user.nodeGoal) {
      const baseTier = Math.max(
        1,
        Math.min(NODE_LADDER.length, typeof user.nodeTier === "number" ? user.nodeTier : 1),
      );
      const bumpedTier = Math.min(NODE_LADDER.length, baseTier + 1);
      return {
        ...NODE_LADDER[bumpedTier - 1],
        dailyRatePct: user.nextNodeRate,
        fundingGoal: user.nodeGoal,
      };
    }
    // Still below the admin milestone → hold the current tier.
    if (typeof user.nodeTier === "number" && user.nodeTier >= 1) {
      const t = Math.min(NODE_LADDER.length, user.nodeTier);
      return {
        ...NODE_LADDER[t - 1],
        dailyRatePct: user.nextNodeRate ?? NODE_LADDER[t - 1].dailyRatePct,
        fundingGoal: user.nodeGoal,
      };
    }
  }

  // Default ladder floor.
  let current = NODE_LADDER[0];
  for (const node of NODE_LADDER) {
    if (bal >= node.fundingGoal) current = node;
  }
  return current;
}

/** The NEXT node the user is climbing toward (null at max tier). */
export function resolveNextNode(
  balance: number,
  user?: Partial<User> | null,
): NodeTierConfig | null {
  const current = resolveCurrentNode(balance, user);
  const next = NODE_LADDER.find((n) => n.tier === current.tier + 1);
  if (!next) return null;

  // Admin override for the next goal/rate wins over the ladder default.
  const goal =
    user && typeof user.nodeGoal === "number" && user.nodeGoal > 0
      ? user.nodeGoal
      : next.fundingGoal;
  const rate =
    user && typeof user.nextNodeRate === "number" && user.nextNodeRate > 0
      ? user.nextNodeRate
      : next.dailyRatePct;

  return { ...next, fundingGoal: goal, dailyRatePct: rate };
}

export interface NodeProgress {
  current: NodeTierConfig;
  next: NodeTierConfig | null;
  /** 0..1 */
  progress: number;
  /** USD still needed to fund the next node */
  remaining: number;
  /** Effective daily rate (%) currently compounding */
  effectiveDailyRatePct: number;
}

/** Full advancement state for dashboards / gauges. */
export function getNodeProgress(
  balance: number,
  user?: Partial<User> | null,
): NodeProgress {
  const current = resolveCurrentNode(balance, user);
  const next = resolveNextNode(balance, user);
  let remaining = 0;
  let progress = next ? 1 : 0;

  if (next) {
    remaining = Math.max(0, next.fundingGoal - Math.max(0, balance));
    const span = Math.max(1, next.fundingGoal - current.fundingGoal);
    progress = Math.min(1, Math.max(0, 1 - remaining / span));
  }

  return {
    current,
    next,
    progress,
    remaining,
    effectiveDailyRatePct:
      user && typeof user.profitRate === "number" && user.profitRate > 0
        ? user.profitRate * Math.max(0.1, user.profitMultiplier ?? 1)
        : current.dailyRatePct,
  };
}
