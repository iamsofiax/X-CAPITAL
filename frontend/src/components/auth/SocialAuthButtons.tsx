"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authAPI } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (res: { credential: string }) => void;
            auto_select?: boolean;
            ux_mode?: string;
          }) => void;
          prompt: () => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (cfg: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: { id_token: string };
          user?: {
            name?: { firstName?: string; lastName?: string };
          };
        }>;
      };
    };
  }
}

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const el = document.createElement("script");
    el.id = id;
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

const BUILD_GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const BUILD_APPLE = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? "";

export default function SocialAuthButtons({
  onGoogle,
  onApple,
  disabled,
}: {
  onGoogle: (credential: string) => Promise<void>;
  onApple: (
    identityToken: string,
    names?: { firstName?: string; lastName?: string },
  ) => Promise<void>;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState<"google" | "apple" | null>(null);
  const [notice, setNotice] = useState("");
  const [googleId, setGoogleId] = useState(BUILD_GOOGLE);
  const [appleId, setAppleId] = useState(BUILD_APPLE);
  const googleInit = useRef(false);
  const appleInit = useRef(false);
  const onGoogleRef = useRef(onGoogle);
  onGoogleRef.current = onGoogle;

  useEffect(() => {
    let cancelled = false;
    void authAPI
      .oauthConfig()
      .then((res) => {
        const cfg = res.data?.data ?? res.data ?? {};
        if (cancelled) return;
        if (typeof cfg.googleClientId === "string" && cfg.googleClientId) {
          setGoogleId(cfg.googleClientId);
        }
        if (typeof cfg.appleClientId === "string" && cfg.appleClientId) {
          setAppleId(cfg.appleClientId);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!googleId) return;
    googleInit.current = false;
    void loadScript("https://accounts.google.com/gsi/client", "xc-gsi").then(
      () => {
        if (!window.google || googleInit.current) return;
        window.google.accounts.id.initialize({
          client_id: googleId,
          ux_mode: "popup",
          auto_select: true,
          callback: async (res) => {
            if (!res.credential) return;
            setBusy("google");
            setNotice("");
            try {
              await onGoogleRef.current(res.credential);
            } catch (err) {
              setNotice(
                err instanceof Error ? err.message : "Google sign-in failed.",
              );
            } finally {
              setBusy(null);
            }
          },
        });
        googleInit.current = true;
      },
    );
  }, [googleId]);

  const handleGoogle = useCallback(() => {
    if (!googleId) {
      setNotice("Google sign-in is not configured on this node.");
      return;
    }
    setNotice("");
    window.google?.accounts.id.prompt();
  }, [googleId]);

  const handleApple = useCallback(async () => {
    if (!appleId) {
      setNotice("Apple sign-in is not configured on this node.");
      return;
    }
    setBusy("apple");
    setNotice("");
    try {
      if (!appleInit.current) {
        await loadScript(
          "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js",
          "xc-apple",
        );
        window.AppleID?.auth.init({
          clientId: appleId,
          scope: "name email",
          redirectURI: window.location.origin,
          usePopup: true,
        });
        appleInit.current = true;
      }
      const result = await window.AppleID!.auth.signIn();
      await onApple(result.authorization.id_token, {
        firstName: result.user?.name?.firstName,
        lastName: result.user?.name?.lastName,
      });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Apple sign-in failed.");
    } finally {
      setBusy(null);
    }
  }, [onApple, appleId]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={disabled || busy !== null}
        onClick={handleGoogle}
        className="w-full py-3 rounded-xl border border-white/[0.12] bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-3"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {busy === "google" ? "Connecting…" : "Continue with Google"}
      </button>
      <button
        type="button"
        disabled={disabled || busy !== null}
        onClick={() => void handleApple()}
        className="w-full py-3 rounded-xl border border-white/[0.12] bg-[#08080c] text-white text-sm font-semibold hover:bg-white/[0.06] transition-colors disabled:opacity-40 flex items-center justify-center gap-3"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M16.37 12.64c-.03-3.17 2.59-4.69 2.71-4.76-1.48-2.16-3.78-2.46-4.6-2.49-1.96-.2-3.82 1.15-4.81 1.15-.99 0-2.53-1.12-4.16-1.09-2.14.03-4.11 1.24-5.21 3.16-2.22 3.85-.57 9.56 1.6 12.69 1.06 1.53 2.32 3.25 3.98 3.19 1.6-.07 2.2-1.03 4.13-1.03 1.93 0 2.47 1.03 4.15 1 .1.72-.03 3.24 3.24-3.18 1.09-1.7 1.54-3.35 1.57-3.44-.03-.02-3-.1.15-3.2zM13.5 3.8c.88-1.07 1.47-2.55 1.31-4.03-1.27.05-2.8.85-3.71 1.92-.82.94-1.54 2.45-1.35 3.9 1.42.11 2.88-.72 3.75-1.79z" />
        </svg>
        {busy === "apple" ? "Connecting…" : "Continue with Apple"}
      </button>
      {notice && (
        <p className="text-xs text-amber-300/90 text-center">{notice}</p>
      )}
    </div>
  );
}
