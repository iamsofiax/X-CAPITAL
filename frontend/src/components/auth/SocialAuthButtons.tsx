"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type TokenClient = {
  requestAccessToken: (override?: { prompt?: string }) => void;
};

type GoogleOauth = {
  initTokenClient: (cfg: {
    client_id: string;
    scope: string;
    callback: (resp: TokenResponse) => void;
    error_callback?: (err: { type?: string; message?: string }) => void;
  }) => TokenClient;
};

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOauth } };
  }
}

interface Props {
  onSuccess: () => void;
  onError: (message: string) => void;
  mode?: "signin" | "signup";
}

function loadGoogle(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-xc-gsi="1"]');
    const done = () => {
      if (window.google?.accounts?.oauth2) resolve();
      else reject(new Error("missing"));
    };
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener("load", done, { once: true });
      existing.addEventListener("error", () => reject(new Error("load")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.dataset.xcGsi = "1";
    script.onload = done;
    script.onerror = () => reject(new Error("load"));
    document.head.appendChild(script);
  });
}

export function SocialAuthButtons({ onSuccess, onError, mode = "signin" }: Props) {
  const loginWithGoogleProfile = useStore((s) => s.loginWithGoogleProfile);
  const [busy, setBusy] = useState(false);

  if (!GOOGLE_CLIENT_ID) return null;

  const start = async () => {
    setBusy(true);
    onError("");
    try {
      await loadGoogle();
      const oauth = window.google?.accounts?.oauth2;
      if (!oauth) throw new Error("missing");
      const client = oauth.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        callback: (resp) => {
          void (async () => {
            if (resp.error || !resp.access_token) {
              setBusy(false);
              onError(resp.error_description || "Google sign-in was cancelled.");
              return;
            }
            try {
              const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${resp.access_token}` },
              });
              if (!userRes.ok) throw new Error("profile");
              const profile = (await userRes.json()) as {
                email?: string;
                given_name?: string;
                family_name?: string;
              };
              if (!profile.email) throw new Error("email");
              const result = loginWithGoogleProfile({
                email: profile.email,
                firstName: profile.given_name,
                lastName: profile.family_name,
              });
              setBusy(false);
              if (result.success) onSuccess();
              else onError(result.error ?? "Sign-in failed.");
            } catch {
              setBusy(false);
              onError("Google signed in, but the desk could not read the account email.");
            }
          })();
        },
        error_callback: (err) => {
          setBusy(false);
          if (err.type === "popup_failed_to_open") {
            onError("Allow popups for this site, then try Google again.");
            return;
          }
          if (err.type === "popup_closed") {
            onError("Google window was closed before sign-in finished.");
            return;
          }
          onError("Google sign-in did not open. Try again.");
        },
      });
      client.requestAccessToken({ prompt: "select_account" });
    } catch {
      setBusy(false);
      onError("Google sign-in could not be loaded. Refresh and try again.");
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          void start();
        }}
        className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white px-5 text-[15px] font-semibold text-black hover:bg-white/90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
        {busy ? "Opening Google…" : mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
      </button>
      <div className="flex items-center gap-3 pt-2">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="sim-label">or with email</span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.6 7.5l6.3 5.3C37.4 38.4 44 33 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
