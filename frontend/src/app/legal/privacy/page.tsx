"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white/70 px-6 py-16 max-w-2xl mx-auto">
      <p className="engine-mono text-[10px] tracking-[0.2em] text-white/35 uppercase mb-4">
        Legal
      </p>
      <h1 className="text-2xl font-black text-white mb-6">Privacy</h1>
      <p className="text-sm leading-relaxed mb-4">
        Account identity, wallet, and yield configuration are stored to operate
        the node. Google or Apple sign-in shares only the mail and name those
        providers release. Session tokens stay on this device.
      </p>
      <Link href="/auth/register" className="text-sm text-white underline">
        Return
      </Link>
    </div>
  );
}
