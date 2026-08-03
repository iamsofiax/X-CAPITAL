/* ══════════════════════════════════════════════════════════════════════
   telemetry.ts — Capital Network Twin · Institutional Telemetry Model

   Nine institutional metrics orbit the settlement core. Each is a
   normalized channel (0..1) that animates with damped interpolation —
   no value ever jumps. Real backend health drives the channels it can
   (Network Status, Oracle Health); the rest model the network fabric at
   institutional resting values with slow, purposeful drift.

   Channel semantics:
   - high is "good" for efficiency / liquidity / reserves / oracle /
     network / velocity
   - low is "good" for settlement latency (inverted when rendering)
   - infrastructure load is healthy in a band (warn past 80%, red past 92%)
   ══════════════════════════════════════════════════════════════════════ */

import type { SystemHealth } from "@/lib/api";

export type TwinMetricId =
  | "efficiency"
  | "settlement"
  | "liquidity"
  | "latency"
  | "reserves"
  | "oracle"
  | "network"
  | "velocity"
  | "load";

export interface TwinMetricSpec {
  id: TwinMetricId;
  label: string;
  /** Render domain for the metric value. */
  min: number;
  max: number;
  /** Normalized resting value (0..1) the channel drifts around. */
  baseline: number;
  /** true = higher value is better; latency-type metrics invert the channel. */
  idealHigh: boolean;
  digits: number;
  unit?: string;
}

export const TWIN_METRICS: TwinMetricSpec[] = [
  { id: "efficiency", label: "Capital Efficiency", min: 0, max: 100, baseline: 0.96, idealHigh: true, digits: 1, unit: "%" },
  { id: "settlement", label: "Settlement Speed", min: 0, max: 50, baseline: 0.44, idealHigh: false, digits: 0, unit: "ms" },
  { id: "liquidity", label: "Liquidity Ratio", min: 0, max: 1, baseline: 0.92, idealHigh: true, digits: 2 },
  { id: "latency", label: "Execution Latency", min: 0, max: 3, baseline: 0.73, idealHigh: false, digits: 1, unit: "ms" },
  { id: "reserves", label: "Reserve Integrity", min: 0, max: 1, baseline: 0.998, idealHigh: true, digits: 3 },
  { id: "oracle", label: "Oracle Health", min: 0, max: 100, baseline: 0.99, idealHigh: true, digits: 1, unit: "%" },
  { id: "network", label: "Network Status", min: 0, max: 1, baseline: 0.5, idealHigh: true, digits: 2 },
  { id: "velocity", label: "Capital Velocity", min: 240_000, max: 420_000, baseline: 0.55, idealHigh: true, digits: 0 },
  { id: "load", label: "Infrastructure Load", min: 0, max: 100, baseline: 0.63, idealHigh: false, digits: 1, unit: "%" },
];

export const NETWORK_LABELS = ["LINKING", "STABLE", "OPTIMAL"] as const;

/** Slow, purposeful drift — sine layers create organic motion, never jitter. */
function drift(n: number, t: number, phase: number, f1: number, f2: number): number {
  return Math.min(
    1,
    Math.max(0, n + 0.035 * Math.sin(t * f1 + phase) + 0.018 * Math.sin(t * f2 + phase * 1.7)),
  );
}

/**
 * Normalized target (0..1) per metric at time t, given real backend health.
 * `t` is wall-clock seconds since page load, so the twins of every visitor
 * drift in lockstep — deterministic, never random-feeling.
 */
export function metricTargets(
  health: SystemHealth | null,
  t: number,
): Record<TwinMetricId, number> {
  const st = (n: number, phase: number) => drift(n, t, phase, 0.13, 0.29);

  const oracleState = health?.services.find((s) => s.name === "ai-oracle")?.status;
  const oracleBase =
    oracleState === "operational" ? 0.985 : oracleState === "degraded" ? 0.8 : 0.45;
  const networkBase =
    health?.status === "healthy" ? 1 : health?.status === "degraded" ? 0.72 : 0.36;

  return {
    efficiency: st(0.96, 0.4),
    settlement: st(0.44, 1.2),
    liquidity: st(0.92, 2.1),
    latency: st(0.73, 0.8),
    reserves: Math.min(1, st(0.998, 3.0)),
    oracle: st(oracleBase, 1.6),
    network: st(networkBase, 0.1),
    velocity: st(0.55, 2.6),
    load: st(0.63, 1.0),
  };
}

/** Render a normalized channel as the raw value within its spec domain. */
export function channelToValue(spec: TwinMetricSpec, channel: number): number {
  const span = spec.max - spec.min;
  const ratio = spec.idealHigh ? channel : 1 - channel;
  return spec.min + span * ratio;
}

export function formatMetric(spec: TwinMetricSpec, channel: number): string {
  if (spec.id === "network") {
    const idx = channel < 0.5 ? 0 : channel < 0.82 ? 1 : 2;
    return NETWORK_LABELS[idx];
  }
  if (spec.id === "velocity") {
    return `$${(channelToValue(spec, channel) / 1000).toFixed(0)}K/s`;
  }
  const value = channelToValue(spec, channel);
  return `${value.toFixed(spec.digits)}${spec.unit ?? ""}`;
}

/** Severity tinting — institutional yellow/red bands, never decorative. */
export function metricTone(spec: TwinMetricSpec, channel: number): "good" | "warn" | "bad" {
  if (spec.id === "load") {
    const v = channelToValue(spec, channel);
    if (v > 92) return "bad";
    if (v > 80) return "warn";
    return "good";
  }
  if (spec.id === "settlement" && channelToValue(spec, channel) > 42) return "warn";
  if (spec.id === "latency" && channelToValue(spec, channel) > 1.6) return "warn";
  if (spec.id === "oracle" && channelToValue(spec, channel) < 70) return "warn";
  if (spec.id === "network" && channel < 0.5) return "warn";
  return channel > 0.25 ? "good" : "warn";
}
