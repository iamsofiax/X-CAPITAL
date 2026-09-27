"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useStore } from "@/store/useStore";
import { latestKyc, pushNotice, submitKyc, type KycPacket } from "@/lib/yieldDesk";

const EMPTY = {
  legalFirst: "",
  legalLast: "",
  dob: "",
  nationality: "",
  address: "",
  city: "",
  region: "",
  postal: "",
  country: "",
  phone: "",
  occupation: "",
  sourceOfFunds: "",
  docType: "Passport" as KycPacket["docType"],
  docNumber: "",
};

export default function KycPage() {
  const user = useStore((s) => s.user);
  const updateUser = useStore((s) => s.updateUser);
  const [form, setForm] = useState(EMPTY);
  const [packet, setPacket] = useState<KycPacket | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const row = latestKyc(user.id);
    setPacket(row);
    const next =
      row?.status === "approved" ? "APPROVED" : row?.status === "rejected" ? "REJECTED" : row?.status === "pending" ? "PENDING" : null;
    if (next && user.kycStatus !== next) updateUser({ kycStatus: next });
  }, [user, updateUser]);

  const set = (key: keyof typeof EMPTY, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user) return;
    const born = new Date(form.dob);
    const adult = new Date();
    adult.setFullYear(adult.getFullYear() - 18);
    if (Number.isNaN(born.getTime()) || born > adult) {
      setError("The node holder must be 18 or older.");
      return;
    }
    if (form.docNumber.trim().length < 4) {
      setError("Enter the document number as printed.");
      return;
    }
    const next = submitKyc({
      userId: user.id,
      email: user.email,
      legalFirst: form.legalFirst.trim(),
      legalLast: form.legalLast.trim(),
      dob: form.dob,
      nationality: form.nationality.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      region: form.region.trim(),
      postal: form.postal.trim(),
      country: form.country.trim(),
      phone: form.phone.trim(),
      occupation: form.occupation.trim(),
      sourceOfFunds: form.sourceOfFunds.trim(),
      docType: form.docType,
      docNumber: form.docNumber.trim(),
    });
    setPacket(next);
    updateUser({ kycStatus: "PENDING" });
    pushNotice(user.id, "Identity received", "The packet is with the operator. The book does not change until they confirm it.");
  };

  return (
    <DashboardLayout title="Identity" subtitle="Full packet · operator confirmation">
      <div className="max-w-3xl space-y-5">
        {packet && (
          <section className="sim-glass p-5 md:p-6">
            <p className="sim-label text-emerald-300">Status</p>
            <p className="mt-2 text-2xl font-black capitalize">{packet.status}</p>
            <p className="mt-2 text-sm text-white/55">
              {packet.legalFirst} {packet.legalLast} · {packet.docType} · submitted {new Date(packet.at).toLocaleString()}
            </p>
            {packet.status === "pending" && (
              <p className="mt-2 text-sm text-amber-200/90">Waiting for the operator. You can replace this packet by sending a new one.</p>
            )}
          </section>
        )}

        <form onSubmit={submit} className="sim-glass p-5 md:p-8 space-y-5">
          <div>
            <p className="sim-label text-emerald-300">Identity packet</p>
            <h2 className="mt-2 text-2xl font-black">Send the full record</h2>
            <p className="mt-2 text-sm text-white/55 leading-relaxed">
              The operator confirms this on the ground station. Nothing is requested by email or chat. The book stays unchanged until they approve.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Legal first name" value={form.legalFirst} onChange={(v) => set("legalFirst", v)} />
            <Field label="Legal last name" value={form.legalLast} onChange={(v) => set("legalLast", v)} />
            <Field label="Date of birth" type="date" value={form.dob} onChange={(v) => set("dob", v)} />
            <Field label="Nationality" value={form.nationality} onChange={(v) => set("nationality", v)} />
            <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} />
            <Field label="Occupation" value={form.occupation} onChange={(v) => set("occupation", v)} />
          </div>
          <Field label="Residential address" value={form.address} onChange={(v) => set("address", v)} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="City" value={form.city} onChange={(v) => set("city", v)} />
            <Field label="Region" value={form.region} onChange={(v) => set("region", v)} />
            <Field label="Postal code" value={form.postal} onChange={(v) => set("postal", v)} />
            <Field label="Country" value={form.country} onChange={(v) => set("country", v)} />
          </div>
          <label className="block">
            <span className="sim-label block mb-2">Source of funds</span>
            <textarea className="sim-input min-h-24" required value={form.sourceOfFunds} onChange={(e) => set("sourceOfFunds", e.target.value)} />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="sim-label block mb-2">Document</span>
              <select className="sim-input" value={form.docType} onChange={(e) => set("docType", e.target.value)}>
                <option>Passport</option>
                <option>National ID</option>
                <option>Driver license</option>
              </select>
            </label>
            <Field label="Document number" value={form.docNumber} onChange={(v) => set("docNumber", v)} />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="sim-btn sim-btn-primary">Submit to the operator</button>
            <Link href="/settings" className="sim-btn sim-btn-ghost">Back to settings</Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="sim-label block mb-2">{label}</span>
      <input className="sim-input" required type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
