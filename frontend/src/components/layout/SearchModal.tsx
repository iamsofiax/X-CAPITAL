"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Settings, X } from "lucide-react";
import { COMMAND_CENTER, RAILS } from "@/lib/rails";
import { INSTRUMENTS, INSTRUMENT_BY_SYMBOL } from "@/lib/sim/instruments";
import { ListedMark, markClass } from "@/components/desk/ListedMark";
import { VAULTS } from "@/lib/sim/vaults";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  label: string;
  description: string;
  href: string;
  group: "Rails" | "Instruments" | "Vaults";
}

const ITEMS: Item[] = [
  { id: "cmd", label: COMMAND_CENTER.label, description: "Command center", href: COMMAND_CENTER.href, group: "Rails" },
  ...RAILS.map((r) => ({ id: r.id, label: r.label, description: r.blurb, href: r.href, group: "Rails" as const })),
  { id: "settings", label: "Settings", description: "Profile, password, theme", href: "/settings", group: "Rails" },
  { id: "kyc", label: "Identity", description: "Full KYC packet for the operator", href: "/settings/kyc", group: "Rails" },
  { id: "links", label: "Link a plan", description: "401(k), IRA, brokerage, or pension", href: "/settings/links", group: "Rails" },
  ...INSTRUMENTS.map((i) => ({
    id: `i-${i.symbol}`,
    label: i.symbol,
    description: `${i.name} · ${i.sector}`,
    href: `/trading?symbol=${i.symbol}`,
    group: "Instruments" as const,
  })),
  ...VAULTS.map((v) => ({
    id: `v-${v.id}`,
    label: v.name,
    description: `${v.code} · ${v.thesis}`,
    href: v.kind === "rwa" ? `/commerce?vault=${v.id}` : `/funds?vault=${v.id}`,
    group: "Vaults" as const,
  })),
];

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s
      ? ITEMS.filter((i) => i.label.toLowerCase().includes(s) || i.description.toLowerCase().includes(s))
      : ITEMS.filter((i) => i.group === "Rails");
    return list.slice(0, 12);
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => setIdx(0), [q]);

  if (!open) return null;

  const go = (item: Item | undefined) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl sim-glass overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-white/[0.06]">
          <Search className="w-4 h-4 text-white/40" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
              if (e.key === "Enter") go(results[idx]);
            }}
            placeholder="Search rails, instruments, vaults…"
            className="flex-1 bg-transparent py-4 text-[14px] text-white placeholder:text-white/30 outline-none"
          />
          <button onClick={onClose} className="text-white/40 hover:text-white" aria-label="Close search">
            <X className="w-4 h-4" />
          </button>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-white/40">No matches.</li>}
          {results.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseEnter={() => setIdx(i)}
                onClick={() => go(item)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left",
                  i === idx ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
                )}
              >
                <span className="sim-label text-[8px] w-20 shrink-0">{item.group}</span>
                {item.group === "Instruments" && INSTRUMENT_BY_SYMBOL[item.label] && (
                  <ListedMark
                    symbol={item.label}
                    name={INSTRUMENT_BY_SYMBOL[item.label].name}
                    cls={markClass(item.label, INSTRUMENT_BY_SYMBOL[item.label].cls)}
                    size="sm"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-white truncate">{item.label}</span>
                  <span className="block text-[11px] text-white/40 truncate">{item.description}</span>
                </span>
                {item.id === "settings" ? <Settings className="w-3.5 h-3.5 text-white/30" /> : <ArrowRight className="w-3.5 h-3.5 text-white/30" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
