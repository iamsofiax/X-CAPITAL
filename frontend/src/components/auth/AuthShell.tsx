import Link from "next/link";
import { XCapitalLogoMark } from "@/components/brand/XCapitalLogo";

const PILLARS = [
  { k: "Ledger", v: "Double-entry cash, house, fee, and profit-pool accounts" },
  { k: "Deposits", v: "Credit only after on-chain confirmation and a unique tx hash" },
  { k: "Custody", v: "Provider wallet ids and xpubs — keys never touch this app" },
  { k: "Rails", v: "Seven-rail desk posted to the authenticated node" },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-black text-white flex flex-col">
      <div className="flex-1 grid lg:grid-cols-[1.1fr_1fr]">
        <aside className="hidden lg:flex flex-col justify-between p-12 border-r border-white/[0.06] relative overflow-hidden">
          <Link href="/" className="flex items-center gap-3">
            <XCapitalLogoMark size={36} />
            <span className="font-black tracking-tight text-lg">X-CAPITAL</span>
          </Link>

          <div className="max-w-lg">
            <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35 mb-4">
              Multi-rail capital desk
            </p>
            <h2 className="text-5xl font-black leading-[1.02] tracking-tight">
              Capital under
              <br />
              <span className="text-white/40">mandate.</span>
            </h2>
            <p className="mt-5 text-white/50 text-[15px] leading-relaxed">
              Isolated node ledgers. Accrual Core is authoritative. Deposits, withdrawals,
              and admin adjustments are journal entries.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3">
              {PILLARS.map((p) => (
                <div key={p.k} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-300/80">{p.k}</div>
                  <div className="text-[13px] text-white/70 mt-1.5 leading-snug">{p.v}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-white/30 max-w-md leading-relaxed">
            Capital products carry risk, including possible loss of principal. Not FDIC insured.
          </p>
        </aside>

        <main className="flex items-center justify-center px-5 py-12">
          <div className="w-full max-w-[540px]">
            <div className="lg:hidden flex flex-col items-center mb-8">
              <XCapitalLogoMark size={44} />
              <span className="mt-3 font-black tracking-tight text-xl">X-CAPITAL</span>
            </div>
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] px-7 py-8 sm:px-10 sm:py-10">
              <h1 className="text-3xl font-black tracking-tight">{title}</h1>
              <p className="text-[15px] text-white/50 mt-2 mb-8 leading-relaxed">{subtitle}</p>
              {children}
            </div>
            {footer && <div className="mt-6 text-center text-sm text-white/45">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
