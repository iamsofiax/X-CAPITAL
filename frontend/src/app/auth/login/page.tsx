"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { AuthShell } from "@/components/auth/AuthShell";
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const loginUser = useStore((s) => s.loginUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const onAuthenticated = useCallback(() => {
    if (rememberMe) {
      localStorage.setItem("xc_remember_me", "1");
    } else {
      localStorage.removeItem("xc_remember_me");
      sessionStorage.setItem("xc_session_active", "1");
    }
    router.push("/dashboard");
  }, [rememberMe, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await loginUser(email.trim(), password, rememberMe);
    setLoading(false);
    if (result.success) onAuthenticated();
    else setError(result.error || "Sign-in failed. Please try again.");
  };

  return (
    <AuthShell
      title="Authenticate"
      subtitle="Sign in to your node."
      footer={
        <>
          New to X-CAPITAL?{" "}
          <Link href="/auth/register" className="text-emerald-300 hover:text-emerald-200 font-semibold">
            Open a node
          </Link>
        </>
      }
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="sim-label block mb-2" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@fund.com"
            required
            autoComplete="email"
            className="sim-input"
          />
        </div>

        <div>
          <label className="sim-label block mb-2" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
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
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-white/50">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="accent-emerald-500"
          />
          Remember me
        </label>

        {error && (
          <div role="alert" className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="sim-btn sim-btn-primary w-full py-3.5">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    </AuthShell>
  );
}
