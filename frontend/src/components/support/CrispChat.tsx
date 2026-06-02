"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";

const CRISP_WEBSITE_ID =
  process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID ||
  "2acaff55-811f-43a8-8a9e-88cf3816f7d0";

declare global {
  interface Window {
    $crisp?: Array<unknown>;
    CRISP_WEBSITE_ID?: string;
  }
}

function pushCrisp(...args: unknown[]) {
  if (typeof window === "undefined") return;
  window.$crisp = window.$crisp || [];
  window.$crisp.push(args);
}

/** Crisp live chat — bottom-right corner on every page. */
export default function CrispChat() {
  const user = useStore((s) => s.user);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.querySelector('script[data-crisp-widget="true"]')) return;
    if (!CRISP_WEBSITE_ID) return;

    window.$crisp = [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    // Brand colour + compact position
    pushCrisp(["config", "color:theme", ["#10b981"]]);
    pushCrisp(["config", "position:reverse", [true]]);

    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    script.setAttribute("data-crisp-widget", "true");
    document.head.appendChild(script);

    return () => {
      script.remove();
      delete window.$crisp;
      delete window.CRISP_WEBSITE_ID;
    };
  }, []);

  // Push user identity whenever auth state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ready = () => {
      if (user?.email) pushCrisp(["set", "user:email", [user.email]]);
      const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
      if (name) pushCrisp(["set", "user:nickname", [name]]);
      if (user?.id) {
        pushCrisp(["set", "session:data", [[["user_id", user.id]]]]);
      }
    };
    if (window.$crisp) {
      ready();
    } else {
      // Crisp may still be loading — attach to its ready event via script onload
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-crisp-widget="true"]',
      );
      if (existing) existing.addEventListener("load", ready);
    }
  }, [user?.email, user?.firstName, user?.lastName, user?.id]);

  return null;
}
