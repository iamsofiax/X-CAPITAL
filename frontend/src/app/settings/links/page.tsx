"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useStore } from "@/store/useStore";
import { linksFor, pushNotice, submitLink, type ExternalLinkRequest } from "@/lib/yieldDesk";

type Kind = ExternalLinkRequest["kind"];

const FLOWS: Record<Kind, {
  title: string;
  blurb: string;
  houseLabel: string;
  houses: string[];
  nameLabel: string;
  nameHint: string;
  titleLabel: string;
  refLabel: string;
  options?: string[];
}> = {
  "401k": {
    title: "401(k)",
    blurb: "Employer plan. The operator matches the participant record.",
    houseLabel: "Recordkeeper",
    houses: ["Fidelity", "Vanguard", "Empower", "Principal", "TIAA", "Other"],
    nameLabel: "Employer and plan",
    nameHint: "Employer · plan name",
    titleLabel: "Participant name",
    refLabel: "Last 4 of the plan account",
  },
  IRA: {
    title: "IRA",
    blurb: "Traditional, Roth, SEP, or SIMPLE. This is not a 401(k).",
    houseLabel: "IRA custodian",
    houses: ["Fidelity", "Charles Schwab", "Vanguard", "E*TRADE", "Interactive Brokers", "Other"],
    nameLabel: "IRA type",
    nameHint: "Traditional, Roth, SEP, or SIMPLE",
    titleLabel: "Account title",
    refLabel: "Last 4 of the IRA",
    options: ["Traditional IRA", "Roth IRA", "SEP IRA", "SIMPLE IRA"],
  },
  Brokerage: {
    title: "Brokerage",
    blurb: "Taxable brokerage. The desk never asks for the broker login.",
    houseLabel: "Broker",
    houses: ["Charles Schwab", "Fidelity", "Interactive Brokers", "E*TRADE", "Robinhood", "Other"],
    nameLabel: "Account type",
    nameHint: "Individual, joint, trust, or entity",
    titleLabel: "Account title",
    refLabel: "Last 4 of the brokerage account",
    options: ["Individual", "Joint", "Trust", "Entity"],
  },
  Pension: {
    title: "Pension",
    blurb: "Defined-benefit or public pension. A sponsor, not a 401(k) menu.",
    houseLabel: "Pension office",
    houses: ["Employer plan", "State or public pension", "TIAA", "Principal", "Other"],
    nameLabel: "Sponsor",
    nameHint: "Employer or public system",
    titleLabel: "Beneficiary name",
    refLabel: "Last 4 of the member number",
  },
};

const ORDER: Kind[] = ["401k", "IRA", "Brokerage", "Pension"];

export default function LinkAccountsPage() {
  const user = useStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<Kind>("401k");
  const [custodian, setCustodian] = useState(FLOWS["401k"].houses[0]);
  const [other, setOther] = useState("");
  const [planName, setPlanName] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [last4, setLast4] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [rows, setRows] = useState<ExternalLinkRequest[]>([]);

  const flow = FLOWS[kind];
  const house = custodian === "Other" ? other.trim() : custodian;
  const usd = Number(amount);
  const existing = useMemo(() => (user ? linksFor(user.id) : rows), [user, rows]);

  const choose = (nextKind: Kind) => {
    setKind(nextKind);
    setCustodian(FLOWS[nextKind].houses[0]);
    setOther("");
    setPlanName(FLOWS[nextKind].options?.[0] ?? "");
    setError("");
    setDone("");
    setStep(1);
  };

  const next = () => {
    setError("");
    if (step === 1 && !house) {
      setError(`Name the ${flow.houseLabel.toLowerCase()}.`);
      return;
    }
    if (step === 2) {
      if (planName.trim().length < 2 || accountTitle.trim().length < 2) {
        setError(`${flow.nameLabel} and ${flow.titleLabel.toLowerCase()} are required.`);
        return;
      }
      if (!/^\d{4}$/.test(last4)) {
        setError("Enter the last 4 digits only. Do not paste a password or a full account number.");
        return;
      }
      if (!(usd > 0)) {
        setError("Enter the USD amount you want the operator to review.");
        return;
      }
    }
    setStep((n) => n + 1);
  };

  const submit = () => {
    if (!user) return;
    submitLink({
      userId: user.id,
      email: user.email,
      kind,
      custodian: house,
      planName: planName.trim(),
      accountTitle: accountTitle.trim(),
      last4,
      requestedUsd: usd,
    });
    pushNotice(user.id, `${flow.title} requested`, `${flow.title} at ${house} is waiting for the operator. Cash is not booked until they confirm the amount.`);
    setRows(linksFor(user.id));
    setDone("Request sent. The operator confirms the link, then books cash only for the amount they verify.");
    setStep(0);
  };

  return (
    <DashboardLayout title="External accounts" subtitle="Separate paths · operator confirmation">
      <div className="max-w-3xl space-y-5">
        <section className="sim-glass p-5 md:p-8">
          <p className="sim-label text-emerald-300">Step {step + 1} of 4 · {flow.title}</p>
          <h2 className="mt-2 text-2xl font-black">{step === 0 ? "Choose the account" : `Link a ${flow.title}`}</h2>
          <p className="mt-2 text-sm text-white/55 leading-relaxed">{flow.blurb} Cash hits the book only after the operator confirms a USD figure.</p>

          {step === 0 && (
            <div className="mt-6 grid sm:grid-cols-2 gap-3 items-stretch">
              {ORDER.map((item) => {
                const card = FLOWS[item];
                return (
                  <button key={item} type="button" onClick={() => choose(item)} className="rounded-2xl border border-white/10 px-4 py-4 text-left min-h-[108px] hover:border-emerald-400/40">
                    <p className="font-bold">{card.title}</p>
                    <p className="text-xs text-white/45 mt-2 leading-relaxed">{card.blurb}</p>
                  </button>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <div className="mt-6 space-y-3">
              <p className="sim-label">{flow.houseLabel}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {flow.houses.map((name) => (
                  <button key={name} type="button" onClick={() => setCustodian(name)} className={`rounded-2xl border px-4 py-3 text-left font-semibold min-h-[52px] ${custodian === name ? "border-emerald-400/50" : "border-white/10"}`}>
                    {name}
                  </button>
                ))}
              </div>
              {custodian === "Other" && (
                <input className="sim-input" placeholder={`${flow.houseLabel} name`} value={other} onChange={(e) => setOther(e.target.value)} />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <label className="block sm:col-span-2">
                <span className="sim-label block mb-2">{flow.nameLabel}</span>
                {flow.options ? (
                  <select className="sim-input" value={planName} onChange={(e) => setPlanName(e.target.value)}>
                    {flow.options.map((opt) => <option key={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input className="sim-input" placeholder={flow.nameHint} value={planName} onChange={(e) => setPlanName(e.target.value)} />
                )}
              </label>
              <label className="block sm:col-span-2">
                <span className="sim-label block mb-2">{flow.titleLabel}</span>
                <input className="sim-input" value={accountTitle} onChange={(e) => setAccountTitle(e.target.value)} />
              </label>
              <label className="block">
                <span className="sim-label block mb-2">{flow.refLabel}</span>
                <input className="sim-input" inputMode="numeric" maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))} />
              </label>
              <label className="block">
                <span className="sim-label block mb-2">USD to review</span>
                <input className="sim-input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </label>
            </div>
          )}

          {step === 3 && (
            <dl className="mt-6 space-y-2 text-sm">
              <Row k="Account" v={flow.title} />
              <Row k={flow.houseLabel} v={house} />
              <Row k={flow.nameLabel} v={planName} />
              <Row k={flow.titleLabel} v={accountTitle} />
              <Row k="Last 4" v={last4} />
              <Row k="Requested" v={`${usd.toLocaleString()} USD`} />
            </dl>
          )}

          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
          {done && <p className="mt-4 text-sm text-emerald-300">{done}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            {step > 0 && (
              <button type="button" className="sim-btn sim-btn-ghost" onClick={() => setStep((n) => n - 1)}>Back</button>
            )}
            {step > 0 && step < 3 && (
              <button type="button" className="sim-btn sim-btn-primary" onClick={next}>Continue</button>
            )}
            {step === 3 && (
              <button type="button" className="sim-btn sim-btn-primary" onClick={submit}>Submit to the operator</button>
            )}
            <Link href="/settings" className="sim-btn sim-btn-ghost">Settings</Link>
          </div>
        </section>

        {existing.length > 0 && (
          <section className="sim-glass p-5 md:p-6">
            <p className="sim-label mb-3">On file</p>
            <ul className="space-y-3">
              {existing.map((row) => (
                <li key={row.id} className="border-t border-white/10 pt-3 text-sm">
                  <p className="font-bold">{FLOWS[row.kind].title} · {row.custodian}</p>
                  <p className="text-white/50 mt-1">{row.planName} · ···{row.last4} · {row.status}{row.bookedUsd ? ` · ${row.bookedUsd.toLocaleString()} USD booked` : ""}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-t border-white/10 pt-2">
      <dt className="text-white/40">{k}</dt>
      <dd className="font-semibold text-right">{v}</dd>
    </div>
  );
}
