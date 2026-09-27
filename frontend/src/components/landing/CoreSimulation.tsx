"use client";

import { useEffect, useState } from "react";
import { currentEpoch, msUntilNextEpoch } from "@/lib/sim/clock";

const EARTH =
  "https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg";

const RINGS = [
  { cls: "orbit-1", size: "28%", sats: 1 },
  { cls: "orbit-2", size: "44%", sats: 2 },
  { cls: "orbit-3", size: "58%", sats: 2 },
  { cls: "orbit-4", size: "72%", sats: 3 },
  { cls: "orbit-5", size: "86%", sats: 3 },
] as const;

const GLOBES = [
  { code: "AMER", name: "Americas", offset: "12%", ring: "orbit-2", size: "44%", spin: "22s" },
  { code: "EMEA", name: "Europe", offset: "48%", ring: "orbit-4", size: "64%", spin: "34s" },
  { code: "APAC", name: "Asia Pac", offset: "76%", ring: "orbit-5", size: "84%", spin: "18s" },
] as const;

const BUS = [
  { n: "01", name: "Public markets" },
  { n: "02", name: "Private equity" },
  { n: "03", name: "Tokenized" },
  { n: "04", name: "Commerce" },
  { n: "05", name: "Oracle" },
  { n: "06", name: "Infrastructure" },
  { n: "07", name: "Orbital" },
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
    <div className="core-console">
      <header className="core-mast">
        <div>
          <p className="core-kicker">X-CAPITAL · Accrual Core</p>
          <p className="core-mast-title">Settlement clock</p>
        </div>
        <div className="core-mast-clock">
          <span>Next pulse</span>
          <strong>{remain}</strong>
        </div>
        <div className="core-mast-meta">
          <span><i className="core-lamp" /> Nominal</span>
          <span>Epoch {pad(epoch % 10000)}</span>
          <span>8h cycle</span>
        </div>
      </header>

      <div className="core-deck">
        <aside className="core-ledger">
          <p className="core-kicker">Stations</p>
          {GLOBES.map((g) => (
            <div key={g.code} className="core-row">
              <span>{g.code}</span>
              <span>{g.name}</span>
              <em>Live</em>
            </div>
          ))}
          <div className="core-row core-row-strong">
            <span>EPOCH</span>
            <span>{epoch}</span>
            <em>Open</em>
          </div>
        </aside>

        <div className="core-plot" aria-hidden={false}>
          <Bezel />
          <div className="core-sim-stage">
            <div className="core-sweep" />
            {RINGS.map((ring) => (
              <div
                key={ring.cls}
                className={`orbit-ring orbit-ring-enhanced ${ring.cls}`}
                style={{ width: ring.size, height: ring.size }}
              >
                {Array.from({ length: ring.sats }).map((_, i) => (
                  <div key={i} className="absolute inset-0" style={{ transform: `rotate(${(360 / ring.sats) * i}deg)` }}>
                    <span className="orbit-satellite" />
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
                    style={{ backgroundImage: `url(${EARTH})`, ["--globe-x" as string]: g.offset }}
                  />
                  <p className="core-globe-label">{g.code}</p>
                </div>
              </div>
            ))}
            <div className="orbit-core" />
            <div className="core-sim-nucleus">
              <span className="core-word">CORE</span>
            </div>
          </div>
        </div>

        <aside className="core-ledger">
          <p className="core-kicker">Book</p>
          <div className="core-row">
            <span>CCY</span>
            <span>USD</span>
            <em>Node</em>
          </div>
          <div className="core-row">
            <span>FEEDS</span>
            <span>IEX · CG</span>
            <em>Live</em>
          </div>
          <div className="core-row">
            <span>MESH</span>
            <span>Nominal</span>
            <em>Clear</em>
          </div>
          <div className="core-signal" aria-hidden>
            <span /><span /><span /><span /><span />
          </div>
        </aside>
      </div>

      <div className="core-mobile">
        <div><span>Epoch</span><strong>{epoch}</strong></div>
        <div><span>Next</span><strong>{remain}</strong></div>
        <div><span>Feeds</span><strong>Live</strong></div>
      </div>

      <footer className="core-register">
        <p className="core-kicker">Rail register</p>
        <ol>
          {BUS.map((rail) => (
            <li key={rail.n}>
              <span className="core-lamp" />
              <span className="core-reg-n">{rail.n}</span>
              <span>{rail.name}</span>
            </li>
          ))}
        </ol>
      </footer>
    </div>
  );
}

function Bezel() {
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <svg className="core-bezel" viewBox="0 0 200 200" aria-hidden>
      <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.6" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(110,231,183,0.35)" strokeWidth="0.4" />
      {ticks.map((i) => {
        const major = i % 5 === 0;
        const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const r1 = major ? 90 : 92.5;
        const r2 = 95.2;
        return (
          <line
            key={i}
            x1={100 + Math.cos(a) * r1}
            y1={100 + Math.sin(a) * r1}
            x2={100 + Math.cos(a) * r2}
            y2={100 + Math.sin(a) * r2}
            stroke={major ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.28)"}
            strokeWidth={major ? 0.8 : 0.4}
          />
        );
      })}
      <text x="100" y="14" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="5">N</text>
      <text x="188" y="102" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="5">E</text>
      <text x="100" y="194" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="5">S</text>
      <text x="12" y="102" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="5">W</text>
    </svg>
  );
}
