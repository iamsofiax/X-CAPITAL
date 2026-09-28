"use client";

import { useEffect, useState } from "react";
import { currentEpoch, msUntilNextEpoch } from "@/lib/sim/clock";

const STATIONS = [
  { code: "AMER", name: "Americas" },
  { code: "EMEA", name: "Europe" },
  { code: "APAC", name: "Asia Pacific" },
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
          <p className="core-kicker">X·CAPITAL · Accrual Core</p>
          <p className="core-mast-title">Settlement clock</p>
        </div>
        <div className="core-mast-clock">
          <span>Next close</span>
          <strong>{remain}</strong>
        </div>
        <div className="core-mast-meta">
          <span><i className="core-lamp" /> Open</span>
          <span>Epoch {pad(epoch % 10000)}</span>
          <span>8h cycle</span>
        </div>
      </header>

      <div className="core-deck">
        <aside className="core-ledger">
          <p className="core-kicker">Stations</p>
          {STATIONS.map((g) => (
            <div key={g.code} className="core-row">
              <span>{g.code}</span>
              <span>{g.name}</span>
              <em>Open</em>
            </div>
          ))}
          <div className="core-row core-row-strong">
            <span>EPOCH</span>
            <span>{epoch}</span>
            <em>Live</em>
          </div>
        </aside>

        <div className="core-plot" aria-label="Accrual Core">
          <svg className="core-bezel" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(231,239,233,0.16)" strokeWidth="0.6" />
            <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(231,239,233,0.1)" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="58" fill="none" stroke="rgba(231,239,233,0.08)" strokeWidth="0.5" />
            <line x1="100" y1="8" x2="100" y2="192" stroke="rgba(231,239,233,0.08)" strokeWidth="0.4" />
            <line x1="8" y1="100" x2="192" y2="100" stroke="rgba(231,239,233,0.08)" strokeWidth="0.4" />
            <rect x="78" y="78" width="44" height="44" fill="#101816" stroke="rgba(231,239,233,0.35)" strokeWidth="0.6" />
            <text x="100" y="103" textAnchor="middle" fill="#f4f7f5" fontSize="8" letterSpacing="2.4">CORE</text>
            <text x="100" y="22" textAnchor="middle" fill="rgba(231,239,233,0.55)" fontSize="5">AMER</text>
            <text x="178" y="102" textAnchor="middle" fill="rgba(231,239,233,0.55)" fontSize="5">EMEA</text>
            <text x="100" y="186" textAnchor="middle" fill="rgba(231,239,233,0.55)" fontSize="5">APAC</text>
          </svg>
        </div>

        <aside className="core-ledger">
          <p className="core-kicker">Book</p>
          <div className="core-row">
            <span>CCY</span>
            <span>USD</span>
            <em>Node</em>
          </div>
          <div className="core-row">
            <span>CLOCK</span>
            <span>8h</span>
            <em>Fixed</em>
          </div>
          <div className="core-row">
            <span>RAILS</span>
            <span>7 / 7</span>
            <em>Armed</em>
          </div>
        </aside>
      </div>

      <div className="core-mobile">
        <div><span>Epoch</span><strong>{epoch}</strong></div>
        <div><span>Next</span><strong>{remain}</strong></div>
        <div><span>Rails</span><strong>7 / 7</strong></div>
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
