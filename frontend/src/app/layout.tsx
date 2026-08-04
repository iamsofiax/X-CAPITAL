import type { Metadata } from "next";
import TawkChat from "@/components/support/TawkChat";
import SessionSync from "@/components/SessionSync";
import SplashBoot from "@/components/SplashBoot";
import LiveCompoundingProvider from "@/components/system/LiveCompoundingProvider";
import XCapitalSplashLogo from "@/components/brand/XCapitalSplashLogo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://xcapital.investments"),
  title: {
    default: "X-CAPITAL — Next-Generation Capital Deployment Platform",
    template: "%s | X-CAPITAL",
  },
  description:
    "X-CAPITAL is the multi-rail capital execution system for public markets, private equity, tokenized assets, and infrastructure investing. One interface. Total control.",
  keywords: [
    "X-CAPITAL",
    "capital deployment",
    "investing platform",
    "public markets",
    "private equity",
    "tokenization",
    "infrastructure investing",
    "AI trading",
    "space economy",
    "fintech",
    "asset management",
    "portfolio management",
  ],
  authors: [{ name: "X-CAPITAL", url: "https://xcapital.investments" }],
  creator: "X-CAPITAL",
  publisher: "X-CAPITAL",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "X-CAPITAL — Next-Generation Capital Deployment Platform",
    description:
      "Public markets. Private equity. Tokenized assets. Infrastructure. One interface, total control over your capital.",
    url: "https://xcapital.investments",
    siteName: "X-CAPITAL",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "X-CAPITAL — Multi-Rail Capital Execution System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "X-CAPITAL — Next-Generation Capital Deployment",
    description:
      "The interface where capital grows. Public markets, private equity, tokenization, infrastructure — one system.",
    images: ["/og-image.png"],
    creator: "@xcapital",
  },
  alternates: {
    canonical: "https://xcapital.investments",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* DNS prefetch + preconnect for instant image/video loading */}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link
          rel="preconnect"
          href="https://images.unsplash.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Structured data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "X-CAPITAL",
              url: "https://xcapital.investments",
              logo: "https://xcapital.investments/favicon.svg",
              description:
                "Next-generation multi-rail capital deployment platform for public markets, private equity, tokenized assets, and infrastructure investing.",
              sameAs: [],
            }),
          }}
        />
        {/* Structured data — WebSite (enables sitelinks search) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "X-CAPITAL",
              url: "https://xcapital.investments",
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://xcapital.investments/oracle?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/* Structured data — SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "X-CAPITAL",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              url: "https://xcapital.investments",
              description:
                "Multi-rail capital execution system — trade public markets, access private equity, tokenized assets, and infrastructure investments from one interface.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
      </head>
      <body className="bg-xc-black text-xc-text antialiased min-h-screen">
        {/* ═══ FUTURISTIC SPLASH SCREEN — INSTITUTIONAL BOOT SEQUENCE ═══ */}
        <div id="xc-splash">
          <div className="xc-splash-content">
            {/* Animated grid lines */}
            <div className="xc-splash-grid" />
            {/* Particle field */}
            <div className="xc-splash-particles">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="xc-splash-dot"
                  style={{
                    left: `${5 + ((i * 4.7) % 90)}%`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: `${1.5 + (i % 3) * 0.5}s`,
                  }}
                />
              ))}
            </div>
            {/* Logo */}
            <div className="xc-splash-logo">
              <XCapitalSplashLogo />
            </div>
            {/* Wordmark */}
            <div className="xc-splash-title">X·CAPITAL</div>
            <div className="xc-splash-subtitle">Capital Deployment Infrastructure</div>
            {/* Loading bar */}
            <div className="xc-splash-bar-track">
              <div className="xc-splash-bar-fill" />
            </div>
            <div className="xc-splash-status">
              INITIALIZING SYSTEMS
              <span className="xc-splash-dots" />
            </div>
            {/* System checks — Goldman-grade boot telemetry */}
            <div className="xc-splash-checks">
              <div className="xc-splash-check" style={{ animationDelay: "0.2s" }}>
                <span>REST API</span>
                <span>OK</span>
              </div>
              <div className="xc-splash-check" style={{ animationDelay: "0.45s" }}>
                <span>AI ORACLE</span>
                <span>OK</span>
              </div>
              <div className="xc-splash-check" style={{ animationDelay: "0.7s" }}>
                <span>POSTGRES</span>
                <span>OK</span>
              </div>
              <div className="xc-splash-check" style={{ animationDelay: "0.95s" }}>
                <span>RAIL SYNC</span>
                <span>OK</span>
              </div>
            </div>
          </div>
        </div>
        {/* Inline script to gate the splash — no React dependency.
            Shows the boot overlay once per session; on repeat loads
            (hard refresh, back-forward) it is hidden instantly so the
            site never replays the boot sequence. The node is only
            *removed* by SplashBoot AFTER React hydrates — never here —
            so we can't race hydration. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var KEY = 'xc_splash_seen';
                var splash = document.getElementById('xc-splash');
                if (!splash) return;
                try {
                  if (sessionStorage.getItem(KEY)) {
                    // Repeat visit — hide before first paint, remove after load.
                    splash.style.display = 'none';
                    var silent = function() {
                      if (splash.parentNode) splash.parentNode.removeChild(splash);
                    };
                    if (document.readyState === 'complete') { silent(); }
                    else {
                      window.addEventListener('load', silent, { once: true });
                    }
                    return;
                  }
                } catch (e) {}
                function dismiss() {
                  try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
                  splash.classList.add('xc-splash-exit');
                  setTimeout(function() {
                    if (splash.parentNode) splash.parentNode.removeChild(splash);
                  }, 600);
                }
                // Dismiss when page is interactive OR after 2.8s max
                if (document.readyState === 'complete') { setTimeout(dismiss, 400); }
                else { window.addEventListener('load', function() { setTimeout(dismiss, 400); }, { once: true }); }
                setTimeout(dismiss, 2800);
              })();
            `,
          }}
        />
        <SessionSync />
        <SplashBoot />
        <LiveCompoundingProvider>{children}</LiveCompoundingProvider>
        <TawkChat />
      </body>
    </html>
  );
}
