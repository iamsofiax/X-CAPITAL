"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white/70 px-6 py-16 max-w-2xl mx-auto">
      <p className="engine-mono text-[10px] tracking-[0.2em] text-white/35 uppercase mb-4">
        Legal
      </p>
      <h1 className="text-2xl font-black text-white mb-6">Terms of access</h1>
      <p className="text-sm leading-relaxed mb-4">
        X-CAPITAL is a capital deployment terminal. Access is for authenticated
        nodes only. Yield, NAV, and rail availability are governed by the
        operator. Capital products carry risk of loss.
      </p>
      <Link href="/auth/register" className="text-sm text-white underline">
        Return
      </Link>
    </div>
  );
}
