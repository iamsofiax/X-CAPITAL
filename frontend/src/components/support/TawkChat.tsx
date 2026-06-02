"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const TAWK_EMBED_SRC =
  "https://embed.tawk.to/6a1e7b25dd90311c2ffb110c/1jq3h23fh";
const TAWK_DIRECT_CHAT_URL =
  "https://tawk.to/chat/6a1e7b25dd90311c2ffb110c/1jq3h23fh";

/** Live chat for customers only — hidden on admin routes. */
export default function TawkChat() {
  const pathname = usePathname() ?? "";
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.dataset.adminRoute = isAdminRoute ? "true" : "false";
    return () => {
      delete document.body.dataset.adminRoute;
    };
  }, [isAdminRoute]);

  if (isAdminRoute) return null;

  return (
    <>
      <Script id="tawk-to-script" strategy="afterInteractive">
        {`var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
Tawk_API.customDirectChatUrl='${TAWK_DIRECT_CHAT_URL}';
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='${TAWK_EMBED_SRC}';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();`}
      </Script>
      <noscript>
        <a href={TAWK_DIRECT_CHAT_URL} target="_blank" rel="noopener noreferrer">
          Open live support chat
        </a>
      </noscript>
    </>
  );
}
