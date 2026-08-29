"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/Button";
import { XCapitalLogoMark } from "@/components/brand/XCapitalLogo";
import { wakeApi } from "@/lib/api";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser, loginWithGoogle, loginWithApple, isAuthenticated } =
    useStore();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  useEffect(() => {
    void wakeApi();
  }, []);
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
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

  const pwStrength = (() => {
    const pw = form.password;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  })();

  const enter = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleGoogle = useCallback(
    async (credential: string) => {
      const result = await loginWithGoogle(credential);
      if (!result.success) {
        throw new Error(result.error || "Google sign-in failed.");
      }
      enter();
    },
    [loginWithGoogle, enter],
  );

  const handleApple = useCallback(
    async (
      identityToken: string,
      names?: { firstName?: string; lastName?: string },
    ) => {
      const result = await loginWithApple(identityToken, names);
      if (!result.success) {
        throw new Error(result.error || "Apple sign-in failed.");
      }
      enter();
    },
    [loginWithApple, enter],
  );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!form.agreeTerms) {
      setError("You must agree to the Terms of Service to continue.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Registration failed. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const PW_COLORS = [
    "bg-xc-red",
    "bg-amber-500",
    "bg-amber-400",
    "bg-xc-green",
    "bg-xc-green",
  ];

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
          <Link href="/" className="inline-flex flex-col items-center gap-4">
            <XCapitalLogoMark size={52} className="mx-auto" />
            <div>
              <div className="font-black text-2xl sm:text-3xl tracking-tight">
                <span className="gradient-text">X-CAPITAL</span>
              </div>
              <p className="text-xc-muted text-sm mt-2">
                Open a node
              </p>
            </div>
          </Link>
        </div>

        <div className="bg-xc-card border border-xc-border rounded-2xl p-8 shadow-2xl shadow-black/60 premium-3d-tilt">
          <h1 className="text-xl font-black text-white mb-6">Register node</h1>

          <SocialAuthButtons
            onGoogle={handleGoogle}
            onApple={handleApple}
            disabled={loading}
          />

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-xc-border" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-xc-muted">
              or email
            </span>
            <div className="flex-1 h-px bg-xc-border" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-xc-muted mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xc-muted" />
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={set("firstName")}
                    placeholder="Jane"
                    required
                    autoComplete="given-name"
                    className="w-full bg-xc-dark/60 border border-xc-border rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-xc-muted mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={set("lastName")}
                  placeholder="Smith"
                  required
                  autoComplete="family-name"
                  className="w-full bg-xc-dark/60 border border-xc-border rounded-xl px-3 py-3 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-xc-muted mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xc-muted" />
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full bg-xc-dark/60 border border-xc-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-xc-muted mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xc-muted" />
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Min 8 characters"
                  required
                  autoComplete="new-password"
                  className="w-full bg-xc-dark/60 border border-xc-border rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xc-muted hover:text-white transition-colors"
                >
                  {showPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {/* Strength indicator */}
              {form.password.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1 rounded-full ${i < pwStrength ? PW_COLORS[pwStrength] : "bg-white/10"}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-medium text-xc-muted mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xc-muted" />
                <input
                  type={showPw ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  placeholder="Repeat password"
                  required
                  autoComplete="new-password"
                  className="w-full bg-xc-dark/60 border border-xc-border rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                {form.confirmPassword.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {form.password === form.confirmPassword ? (
                      <CheckCircle2 className="w-4 h-4 text-xc-green" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-xc-red" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agreeTerms}
                onChange={set("agreeTerms")}
                className="mt-0.5 accent-white"
              />
              <span className="text-xs text-xc-muted leading-relaxed">
                I agree to X-CAPITAL&apos;s{" "}
                <Link href="/legal/terms" className="text-white/70 hover:text-white transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/legal/privacy" className="text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                . I understand that investment products involve risk.
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 text-xs text-xc-red bg-red-950/30 border border-red-700/40 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
            >
              Open node
            </Button>
          </form>

          <p className="text-center text-sm text-xc-muted mt-5">
            Already authenticated?{" "}
            <Link
              href="/auth/login"
              className="text-white/70 hover:text-white font-semibold transition-colors"
            >
              Enter
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
