"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { CommerceDesk } from "@/components/desk/CommerceDesk";
import { VaultDesk } from "@/components/sim/VaultDesk";
import { RWA_VAULTS } from "@/lib/sim/vaults";

export default function RwaPage() {
  return (
    <DashboardLayout title="Commerce" subtitle="Atelier · robotaxi fleet · tokenized sleeves" wide requireGenesis>
      <div className="space-y-10">
        <CommerceDesk />
        <VaultDesk
          vaults={RWA_VAULTS}
          intro={
            <p className="text-[13px] text-white/50 max-w-3xl leading-relaxed">
              Tokenized sleeves on institutional terms: minimum tickets, redemption windows after each
              subscription, and a 5% performance fee.
            </p>
          }
        />
      </div>
    </DashboardLayout>
  );
}
