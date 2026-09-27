import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-[11px] font-mono uppercase tracking-widest text-white/40 hover:text-white">
          X-CAPITAL
        </Link>
        <h1 className="mt-6 text-4xl font-black tracking-tight">Terms of Service</h1>
        <div className="mt-8 space-y-4 text-sm text-white/60 leading-relaxed">
          <p>
            Access to the desk is for an authenticated node. The book, deposits, and withdrawals on that node belong to the account that signed in.
          </p>
          <p>
            Capital products can lose value. Yield figures on the panel are display models. They are not a promise of return, and they are not a bank deposit.
          </p>
          <p>
            You are responsible for the email and password on the node. Do not share the session.
          </p>
          <p>
            The operator may suspend a node that is used to break the law or to interfere with the desk.
          </p>
        </div>
      </div>
    </main>
  );
}
