"use client";

import OrbitalConstellation from "@/components/starlink/OrbitalConstellation";
import StarlinkStats from "@/components/starlink/StarlinkStats";
import { STARLINK_PROMO } from "@/lib/nodeCopy";
import { cn } from "@/lib/utils";

interface OrbitalHeroProps {
  dense?: boolean;
  showStats?: boolean;
  className?: string;
}

export default function OrbitalHero({
  dense = false,
  showStats = true,
  className,
}: OrbitalHeroProps) {
  return (
    <div
      className={cn(
        "relative node-panel rounded-xl overflow-hidden p-6 md:p-8",
        className,
      )}
    >
      <div className="constellation-mesh absolute inset-0 opacity-40 pointer-events-none" />
      <div className="relative flex flex-col lg:flex-row items-center gap-8">
        <OrbitalConstellation size={dense ? 220 : 280} dense={dense} />
        <div className="flex-1 text-center lg:text-left">
          <p className="node-telemetry text-node-signal mb-2">XLINK UPLINK ACTIVE</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {STARLINK_PROMO.title}
          </h2>
          <p className="text-node-muted mt-2 text-sm max-w-md">
            {STARLINK_PROMO.tagline}. {STARLINK_PROMO.apy}.
          </p>
          {showStats && (
            <div className="mt-6 max-w-sm mx-auto lg:mx-0">
              <StarlinkStats />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
