"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";

const CRISP_WEBSITE_ID = "2acaff55-811f-43a8-8a9e-88cf3816f7d0";

declare global {
  interface Window {
    $crisp?: Array<unknown>;
    CRISP_WEBSITE_ID?: string;
  }
}

function pushCrisp(...args: unknown[]) {
  window.$crisp = window.$crisp || [];
  window.$crisp.push(args);
}

/** Crisp live chat — bottom-right on every page. */
export default function CrispChat() {
  const user = useStore((s) => s.user);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.querySelector('script[data-crisp-widget="true"]')) return;

    window.$crisp = window.$crisp || [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    pushCrisp(["config", "color:theme", ["#10b981"]]);
    pushCrisp(["config", "position:x", [20]]);
    pushCrisp(["config", "position:y", [20]]);

    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    script.setAttribute("data-crisp-widget", "true");
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.$crisp) return;

    if (user?.email) {
      pushCrisp(["set", "user:email", [user.email]]);
    }
    const nickname = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
    if (nickname) {
      pushCrisp(["set", "user:nickname", [nickname]]);
    }
  }, [user?.email, user?.firstName, user?.lastName]);

  return null;
}
