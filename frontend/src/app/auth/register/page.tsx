"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { sessionKeys } from "@/lib/sessionScope";
import { AuthShell } from "@/components/auth/AuthShell";
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  agreeTerms: boolean;
}

const STRENGTH_COLORS = ["bg-red-500", "bg-amber-500", "bg-amber-400", "bg-emerald-400", "bg-emerald-400"];

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useStore((s) => s.registerUser);
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    agreeTerms: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set =
    (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({
        ...prev,
        [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
      }));

  const pw = form.password;
  const pwStrength =
    Number(pw.length >= 8) +
    Number(/[A-Z]/.test(pw)) +
    Number(/[0-9]/.test(pw)) +
    Number(/[^A-Za-z0-9]/.test(pw));

  const onAuthenticated = useCallback(() => {
    localStorage.setItem(sessionKeys().remember, "1");
    router.push("/dashboard");
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!form.agreeTerms) {
      setError("Please agree to the Terms of Service to continue.");
      return;
    }
    setLoading(true);
    const result = await registerUser({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
    });
    setLoading(false);
    if (result.success) onAuthenticated();
    else setError(result.error || "Registration failed. Please try again.");
  };

  return (
    <AuthShell
      title="Open a node"
      subtitle="Isolated ledger. Deposits credit after on-chain confirmation."
      footer={
        <>
          Already running a book?{" "}
          <Link href="/auth/login" className="text-emerald-300 hover:text-emerald-200 font-semibold">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="sim-label block mb-2" htmlFor="firstName">First name</label>
            <input id="firstName" value={form.firstName} onChange={set("firstName")} required autoComplete="given-name" className="sim-input" />
          </div>
          <div>
            <label className="sim-label block mb-2" htmlFor="lastName">Last name</label>
            <input id="lastName" value={form.lastName} onChange={set("lastName")} required autoComplete="family-name" className="sim-input" />
          </div>
        </div>

        <div>
          <label className="sim-label block mb-2" htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={set("email")} placeholder="you@fund.com" required autoComplete="email" className="sim-input" />
        </div>

        <div>
          <label className="sim-label block mb-2" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              placeholder="Min 8 characters"
              required
              autoComplete="new-password"
              className="sim-input pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {pw.length > 0 && (
            <div className="flex gap-1 mt-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`flex-1 h-1 rounded-full ${i < pwStrength ? STRENGTH_COLORS[pwStrength] : "bg-white/10"}`} />
              ))}
            </div>
          )}
        </div>

        <label className="flex items-start gap-3 cursor-pointer text-xs text-white/50 leading-relaxed">
          <input type="checkbox" checked={form.agreeTerms} onChange={set("agreeTerms")} className="mt-0.5 accent-emerald-500" />
          <span>
            I agree to the{" "}
            <Link href="/legal/terms" className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2">
              Terms of Service
            </Link>
            .
          </span>
        </label>

        {error && (
          <div role="alert" className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="sim-btn sim-btn-primary w-full py-3.5">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create account <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    </AuthShell>
  );
}
