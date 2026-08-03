"use client";

import { useEffect, useRef, useState } from "react";
import { useApiHealth } from "@/hooks/useApiHealth";
import {
  TWIN_METRICS,
  formatMetric,
  metricTargets,
  type TwinMetricId,
  type TwinMetricSpec,
} from "./telemetry";

/* ══════════════════════════════════════════════════════════════════════
   useTwinTelemetry — smoothed channel state for the Capital Network Twin.

   Every metric is a normalized channel (0..1). A single requestAnimationFrame
   loop moves each channel toward its target with exponential damping —
   velocity is frame-rate independent (delta-clocked), so nothing ever
   jitters and every transition feels engineered.

   Performance contract:
   - One rAF loop drives all nine channels (no per-metric timers).
   - The loop pauses when the tab is hidden and snap-resumes on return.
   - Targets recompute from wall-clock t, so drift continues deterministically
     even across suspensions.
   ══════════════════════════════════════════════════════════════════════ */

interface TwinTelemetry {
  /** Live, damped channel values keyed by metric id (0..1). */
  channels: Record<TwinMetricId, number>;
  /** Snapshots (id → current raw value) for HUD rendering. */
  values: Record<TwinMetricId, string>;
  specs: TwinMetricSpec[];
  /** True once channels have settled from their initial state. */
  ready: boolean;
}

const STARTING_CHANNEL = 0.28;
/** Damping factor — lower = more glide; tuned so the UI reads as alive, not frantic. */
const DAMP = 0.05;
const INITIAL_T = typeof window !== "undefined" ? performance.now() / 1000 : 0;

function createInitialChannels(): Record<TwinMetricId, number> {
  const channels = {} as Record<TwinMetricId, number>;
  for (const spec of TWIN_METRICS) {
    // Slight per-metric offset so the grid doesn't march in lockstep at boot.
    channels[spec.id] = Math.min(0.42, STARTING_CHANNEL + spec.baseline * 0.12);
  }
  return channels;
}

export function useTwinTelemetry(): TwinTelemetry {
  const { health } = useApiHealth(30_000);
  const [channels, setChannels] = useState<Record<TwinMetricId, number>>(createInitialChannels);
  const [ready, setReady] = useState(false);

  const channelsRef = useRef(channels);
  const healthRef = useRef(health);
  const timeRef = useRef(INITIAL_T);

  // Keep the latest health without re-creating the rAF loop.
  useEffect(() => {
    healthRef.current = health;
  }, [health]);

  useEffect(() => {
    let raf: number;
    let running = true;
    const start = performance.now();

    const step = (now: number) => {
      if (!running) return;
      const t = (now - start) / 1000 + INITIAL_T;
      timeRef.current = t;
      const elapsed = now - (step.last ?? now);
      step.last = now;
      // Frame-rate-independent damping factor (≈0.95 @ 60fps).
      const alpha = 1 - Math.pow(1 - DAMP, Math.min(2, elapsed / 16.667));

      const targets = metricTargets(healthRef.current, t);
      const nextChannels = channelsRef.current;
      let changed = false;
      for (const spec of TWIN_METRICS) {
        const current = nextChannels[spec.id];
        const target = targets[spec.id];
        const next = current + (target - current) * alpha;
        if (Math.abs(next - current) > 0.00001) changed = true;
        nextChannels[spec.id] = next;
      }
      if (changed) {
        channelsRef.current = { ...nextChannels };
        setChannels(channelsRef.current);
        setReady(true);
      }
      raf = requestAnimationFrame(step);
    };
    step.last = start;
    raf = requestAnimationFrame(step);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        step.last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Memoized value strings — only rebuilt when a channel actually changes
  // (setChannels with a new object reference on change; stale channels skip).
  const valuesRef = useRef<Record<TwinMetricId, string>>({} as Record<TwinMetricId, string>);
  for (const spec of TWIN_METRICS) {
    const channel = channels[spec.id];
    valuesRef.current[spec.id] = formatMetric(spec, channel);
  }

  return {
    channels,
    values: valuesRef.current,
    specs: TWIN_METRICS,
    ready,
  };
}
