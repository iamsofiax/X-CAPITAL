"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/sim/Panel";

export default function KycNoticePage() {
  return (
    <DashboardLayout title="Identity verification" subtitle="KYC for the authenticated node">
      <Panel code="KYC" title="No identity documents needed" className="max-w-2xl">
        <div className="flex gap-4">
          <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          <div className="space-y-3 text-[14px] text-white/65 leading-relaxed">
            <p>
              Identity verification is required before the node may fund or withdraw. Documents are accepted only
              through this desk, under the mandate on the authenticated node.
            </p>
            <p>X-CAPITAL does not request identity documents, credentials, or bank details by email or in chat.</p>
            <Link href="/dashboard" className="sim-btn sim-btn-ghost inline-flex">Back to command center</Link>
          </div>
        </div>
      </Panel>
    </DashboardLayout>
  );
}
