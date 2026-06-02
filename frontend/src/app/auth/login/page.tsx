"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/Button";
import { XCapitalLogoMark } from "@/components/brand/XCapitalLogo";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginUser(email, password);
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem("xc_remember_me", "1");
        } else {
          localStorage.removeItem("xc_remember_me");
          sessionStorage.setItem("xc_session_active", "1");
        }
        router.push("/dashboard");
      } else {
        setError(result.error || "Invalid credentials. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-xc-black flex flex-col">
      <div className="fixed inset-0 bg-gradient-to-br from-white/[0.04]/10 via-transparent to-black pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 0%, rgba(16,185,129,0.06) 0%, transparent 55%)`,
        }}
      />

      <div className="flex-1 flex items-center justify-center px-5 pt-14 pb-10 sm:pt-16 sm:pb-12 md:py-12">
        <div className="w-full max-w-md relative premium-3d-scene">
          <div className="text-center mb-10 sm:mb-12">
            <Link
              href="/"
              className="inline-flex flex-col items-center gap-4 group"
            >
              <XCapitalLogoMark
                size={52}
                className="mx-auto shadow-emerald-500/10 group-hover:shadow-emerald-500/20"
              />
              <div>
                <div className="font-black text-2xl sm:text-3xl tracking-tight">
                  <span className="gradient-text">X-CAPITAL</span>
                </div>
                <p className="text-xc-muted text-sm mt-2">
                  Sign in to your account
                </p>
              </div>
            </Link>
          </div>

          <div className="bg-xc-card border border-xc-border rounded-2xl p-8 shadow-2xl shadow-black/60 premium-3d-tilt">
            <h1 className="text-xl font-black text-white mb-6">Welcome back</h1>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-xc-muted mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xc-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full bg-xc-dark/60 border border-xc-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-xc-muted">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xc-muted" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full bg-xc-dark/60 border border-xc-border rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xc-muted hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-xc-red bg-red-950/30 border border-red-700/40 rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <button
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                      rememberMe
                        ? "bg-emerald-500 border-emerald-500"
                        : "bg-transparent border-xc-border hover:border-white/40"
                    }`}
                  >
                    {rememberMe && (
                      <svg className="w-3 h-3 text-black" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className="text-xs text-xc-muted">Remember me</span>
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                loading={loading}
              >
                Sign In
              </Button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-xc-border" />
              <span className="text-xs text-xc-muted">or</span>
              <div className="flex-1 h-px bg-xc-border" />
            </div>

            <p className="text-center text-sm text-xc-muted">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="text-white/70 hover:text-white font-semibold transition-colors"
              >
                Create account
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-xc-muted/60 mt-8 leading-relaxed px-2">
            By signing in, you agree to X-CAPITAL&apos;s{" "}
            <span className="text-xc-muted hover:text-white cursor-pointer transition-colors">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="text-xc-muted hover:text-white cursor-pointer transition-colors">
              Privacy Policy
            </span>
            . Investment products involve risk. Past performance does not
            guarantee future results.
          </p>
        </div>
      </div>
    </div>
  );
}
