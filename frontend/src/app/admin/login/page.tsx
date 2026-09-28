"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { XCapitalLogoMark } from "@/components/brand/XCapitalLogo";
import { SimulationBadge } from "@/components/sim/SimulationBadge";
import { isAdminUser } from "@/lib/apiUser";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginUser, user } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const finish = () => setReady(true);
    if (useStore.persist.hasHydrated()) finish();
    const unsub = useStore.persist.onFinishHydration(finish);
    void useStore.persist.rehydrate();
    return unsub;
  }, []);

  useEffect(() => {
    if (ready && isAdminUser(user)) router.replace("/admin");
  }, [ready, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginUser(email, password);
      if (!result.success) {
        setError(result.error || "Invalid credentials.");
        return;
      }

      // Check if the logged-in user is actually an admin
      const store = useStore.getState();
      const loggedInUser = store.user;
      if (!isAdminUser(loggedInUser)) {
        // Not an admin — log them out and show error
        store.logout();
        setError("Access restricted to administrators only.");
        return;
      }

      router.push("/admin");
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (ready && isAdminUser(user)) {
    return (
      <div className="min-h-screen bg-[#08080c] text-white px-4 sm:px-6 py-16">
        <p className="text-sm text-white/55">Opening the desk</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080c] flex flex-col">
      <SimulationBadge variant="banner" />
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 50%)`,
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Brand */}
        <div className="text-center mb-8">
          <XCapitalLogoMark size={52} className="mx-auto mb-4" />
          <h1 className="text-xl font-black text-white tracking-tight">
            X-CAPITAL{" "}
            <span className="text-white/40 font-normal text-sm ml-1">
              ADMIN
            </span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Authorized personnel only
          </p>
        </div>

        {/* Form */}
        <div className="sim-glass p-7">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  className="sim-input pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="sim-input pl-10 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
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

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 border border-red-800/30 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="sim-btn sim-btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-600 mt-6">
          Restricted access · operators only
        </p>
      </div>
      </div>
    </div>
  );
}
