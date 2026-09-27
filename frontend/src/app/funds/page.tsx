"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { VaultDesk } from "@/components/sim/VaultDesk";
import { STRATEGY_VAULTS } from "@/lib/sim/vaults";

export default function VaultsPage() {
  return (
    <DashboardLayout title="Vaults" subtitle="R4 · Strategy vaults · 10% performance fee above high-water mark" wide requireGenesis>
      <VaultDesk
        vaults={STRATEGY_VAULTS}
        intro={
          <p className="text-[13px] text-white/50 max-w-3xl leading-relaxed">
            Strategy sleeves with different behavior across market regimes. Subscriptions post to the node book.
            Performance fees apply only above each vault’s high-water mark.
          </p>
        }
      />
    </DashboardLayout>
  );
}
