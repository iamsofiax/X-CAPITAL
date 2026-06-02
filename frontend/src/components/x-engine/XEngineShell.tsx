"use client";

import EngineHUD from "./EngineHUD";
import SignalPulse from "./SignalPulse";
import MissionCanvas from "./MissionCanvas";

interface XEngineShellProps {
  children: React.ReactNode;
  wide?: boolean;
}

export default function XEngineShell({ children, wide }: XEngineShellProps) {
  return (
    <div className="x-engine-shell relative overflow-visible">
      <div className="x-engine-field pointer-events-none" aria-hidden />
      <EngineHUD />
      <SignalPulse />
      <MissionCanvas wide={wide}>{children}</MissionCanvas>
    </div>
  );
}
