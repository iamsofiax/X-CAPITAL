import { fmtNum, fmtPct } from "@/lib/sim/format";

/**
 * Ring showing the user's veXC weight as a share of the network. The inner arc shows
 * how much of the user's locked sXC is still earning (weight decays toward unlock).
 */
export function ConvictionDial({
  weight,
  locked,
  poolShare,
  apr,
}: {
  weight: number;
  locked: number;
  poolShare: number;
  apr: number;
}) {
  const outerR = 62;
  const innerR = 48;
  const co = 2 * Math.PI * outerR;
  const ci = 2 * Math.PI * innerR;
  // Pool share is tiny in absolute terms; scale on a log axis from 1e-7 to 1e-2 so progress is visible.
  const logShare = poolShare > 0 ? (Math.log10(poolShare) + 7) / 5 : 0;
  const outer = Math.max(0, Math.min(1, logShare));
  const inner = locked > 0 ? Math.min(1, weight / locked) : 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-[148px] h-[148px] shrink-0">
        <svg viewBox="0 0 148 148" className="w-full h-full -rotate-90" aria-hidden>
          <circle cx="74" cy="74" r={outerR} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle
            cx="74" cy="74" r={outerR} fill="none" stroke="rgba(231,239,233,0.72)" strokeWidth="8" strokeLinecap="butt"
            strokeDasharray={co} strokeDashoffset={co * (1 - outer)}
          />
          <circle cx="74" cy="74" r={innerR} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
          <circle
            cx="74" cy="74" r={innerR} fill="none" stroke="rgba(231,239,233,0.38)" strokeWidth="5" strokeLinecap="butt"
            strokeDasharray={ci} strokeDashoffset={ci * (1 - inner)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="sim-label text-[8px]">Weight</span>
          <span className="sim-num text-white font-bold text-lg leading-tight">{fmtNum(weight, 2)}</span>
          <span className="sim-num text-[10px] text-white/70">{fmtPct(apr, 2, false)} APR</span>
        </div>
      </div>
      <dl className="space-y-2.5 text-[12px] min-w-0">
        <div>
          <dt className="sim-label text-[8.5px]">Network share</dt>
          <dd className="sim-num text-white font-bold">{(poolShare * 100).toPrecision(3)}%</dd>
        </div>
        <div>
          <dt className="sim-label text-[8.5px]">Locked XC</dt>
          <dd className="sim-num text-white font-bold">{fmtNum(locked, 2)}</dd>
        </div>
        <div>
          <dt className="sim-label text-[8.5px]">Weight retained</dt>
          <dd className="sim-num text-white font-bold">{fmtPct(inner, 1, false)}</dd>
        </div>
      </dl>
    </div>
  );
}
