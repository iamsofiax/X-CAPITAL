import { CheckCircle2, Circle } from "lucide-react";
import { ACHIEVEMENTS } from "@/lib/sim/scoring";
import { cn } from "@/lib/utils";

export function Achievements({ earned }: { earned: string[] }) {
  return (
    <ul className="grid sm:grid-cols-2 gap-2">
      {ACHIEVEMENTS.map((a) => {
        const done = earned.includes(a.id);
        return (
          <li
            key={a.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-3 py-2.5",
              done ? "border-emerald-400/25 bg-emerald-400/[0.05]" : "border-white/[0.06] bg-white/[0.015]",
            )}
          >
            {done ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-white/20 mt-0.5 shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className={cn("text-[13px] font-bold", done ? "text-white" : "text-white/60")}>{a.title}</p>
              <p className="text-[11.5px] text-white/40 leading-snug">{a.description}</p>
            </div>
            <span className="sim-num text-[10px] text-white/40 shrink-0">+{a.xp} XP</span>
          </li>
        );
      })}
    </ul>
  );
}
