"use client";

import { useEffect, useState } from "react";
import { currentEpoch, msUntilNextEpoch } from "@/lib/sim/clock";

const EARTH =
  "https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg";

const RINGS = [
  { cls: "orbit-1", size: "34%", sats: 2 },
  { cls: "orbit-2", size: "46%", sats: 3 },
  { cls: "orbit-3", size: "58%", sats: 2 },
  { cls: "orbit-4", size: "70%", sats: 4 },
  { cls: "orbit-5", size: "82%", sats: 3 },
  { cls: "orbit-6", size: "94%", sats: 5 },
] as const;

const GLOBES = [
  { label: "Americas", code: "AMER", offset: "18%", ring: "orbit-2", size: "52%", spin: "18s" },
  { label: "EMEA", code: "EMEA", offset: "52%", ring: "orbit-4", size: "72%", spin: "30s" },
  { label: "APAC", code: "APAC", offset: "78%", ring: "orbit-6", size: "90%", spin: "15s" },
] as const;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatRemain(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function CoreSimulation() {
  const [epoch, setEpoch] = useState(() => currentEpoch());
  const [remain, setRemain] = useState(() => formatRemain(msUntilNextEpoch()));

  useEffect(() => {
    const id = setInterval(() => {
      setEpoch(currentEpoch());
      setRemain(formatRemain(msUntilNextEpoch()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="core-sim relative w-full">
      <div className="constellation-mesh-v2 pointer-events-none absolute inset-0 opacity-80" />

      <div className="relative grid lg:grid-cols-[200px_1fr_200px] gap-4 items-center">
        <aside className="hidden lg:flex flex-col gap-3 self-stretch justify-center">
          <HudCard label="Epoch" value={String(epoch)} sub="8h settlement" />
          <HudCard label="Next pulse" value={remain} sub="Network clock" />
          <HudCard label="Desks" value="03" sub="Americas · EMEA · APAC" />
        </aside>

        <div className="core-sim-stage mx-auto">
          {RINGS.map((ring) => (
            <div
              key={ring.cls}
              className={`orbit-ring orbit-ring-enhanced ${ring.cls}`}
              style={{ width: ring.size, height: ring.size }}
            >
              {Array.from({ length: ring.sats }).map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0"
                  style={{ transform: `rotate(${(360 / ring.sats) * i}deg)` }}
                >
                  <span className={i % 2 === 0 ? "orbit-satellite" : "orbit-satellite dim"} />
                </div>
              ))}
            </div>
          ))}

          {GLOBES.map((g) => (
            <div
              key={g.code}
              className={`orbit-ring ${g.ring}`}
              style={{ width: g.size, height: g.size, borderColor: "transparent" }}
            >
              <div className="core-globe-holder" style={{ ["--spin" as string]: g.spin }}>
                <div
                  className="core-globe xc-globe-spin"
                  style={{
                    backgroundImage: `url(${EARTH})`,
                    ["--globe-x" as string]: g.offset,
                  }}
                />
                <p className="core-globe-label">{g.code}</p>
              </div>
            </div>
          ))}

          <div className="orbit-signal" />
          <div className="orbit-signal" style={{ animationDelay: "1.4s" }} />
          <span className="satellite-beam left-1/2 top-[12%] h-[38%] -translate-x-1/2" />
          <span className="data-packet" style={{ top: "18%", left: "62%" }} />
          <span className="data-packet" style={{ top: "70%", left: "28%", animationDelay: "1.1s" }} />
          <span className="data-packet" style={{ top: "42%", left: "78%", animationDelay: "2s" }} />
          <div className="orbit-core" />
          <div className="core-sim-nucleus">
            <span className="node-telemetry text-emerald-300/90">Core</span>
          </div>
        </div>

        <aside className="hidden lg:flex flex-col gap-3 self-stretch justify-center">
          <HudCard label="Feeds" value="LIVE" sub="Alpaca IEX · CoinGecko" live />
          <HudCard label="Book" value="USD" sub="Node ledger" />
          <div className="node-panel node-scan-line p-4">
            <p className="node-telemetry mb-2">Signal</p>
            <div className="signal-bars h-8">
              <span className="signal-bar" />
              <span className="signal-bar" />
              <span className="signal-bar" />
              <span className="signal-bar" />
            </div>
            <p className="engine-readout mt-3">MESH · NOMINAL</p>
          </div>
        </aside>
      </div>

      <div className="lg:hidden mt-6 grid grid-cols-3 gap-2">
        <HudCard label="Epoch" value={String(epoch)} />
        <HudCard label="Next" value={remain} />
        <HudCard label="Feeds" value="LIVE" live />
      </div>
    </div>
  );
}

function HudCard({
  label,
  value,
  sub,
  live,
}: {
  label: string;
  value: string;
  sub?: string;
  live?: boolean;
}) {
  return (
    <div className="node-panel node-scan-line p-4">
      <p className="node-telemetry flex items-center gap-2">
        {live ? <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" /> : null}
        {label}
      </p>
      <p className="sim-num text-xl font-black mt-1 tracking-tight">{value}</p>
      {sub ? <p className="engine-readout mt-1">{sub}</p> : null}
    </div>
  );
}
