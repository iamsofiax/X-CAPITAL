"use client";

import { useEffect, useState } from "react";
import { currentEpoch, msUntilNextEpoch } from "@/lib/sim/clock";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function LandingTelemetry() {
  const [epoch, setEpoch] = useState(() => currentEpoch());
  const [clock, setClock] = useState(() => msUntilNextEpoch());

  useEffect(() => {
    const id = setInterval(() => {
      setEpoch(currentEpoch());
      setClock(msUntilNextEpoch());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(clock / 3_600_000);
  const m = Math.floor((clock % 3_600_000) / 60_000);
  const s = Math.floor((clock % 60_000) / 1000);

  return (
    <div className="hidden md:flex items-center gap-5 node-telemetry text-white/45">
      <span className="flex items-center gap-1.5">
        <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Feeds live
      </span>
      <span>Epoch {epoch}</span>
      <span className="sim-num">
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
      <span>7 rails</span>
    </div>
  );
}
