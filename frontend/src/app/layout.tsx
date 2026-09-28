import type { Metadata } from "next";
import TawkChat from "@/components/support/TawkChat";
import SessionSync from "@/components/SessionSync";
import SessionScope from "@/components/SessionScope";
import XCapitalSplashLogo from "@/components/brand/XCapitalSplashLogo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://xcapital.investments"),
  title: {
    default: "X-CAPITAL — Public markets, private sleeves, one book",
    template: "%s | X-CAPITAL",
  },
  description:
    "X-CAPITAL at xcapital.investments is the operator desk for public markets, private equity, tokenized assets, and infrastructure. Seven rails. One node. One book.",
  keywords: [
    "X-CAPITAL",
    "X Capital",
    "X CAPITAL",
    "X Investment",
    "xcapital.investments",
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
    title: "X-CAPITAL — Public markets, private sleeves, one book",
    description:
      "X-CAPITAL at xcapital.investments runs public markets, private equity, tokenized assets, and infrastructure on one isolated book.",
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
    title: "X-CAPITAL — Public markets, private sleeves, one book",
    description:
      "X-CAPITAL at xcapital.investments runs public markets, private equity, tokenized assets, and infrastructure on one isolated book.",
    images: ["/og-image.png"],
    creator: "@xcapital",
  },
  alternates: {
    canonical: "https://xcapital.investments",
  },
  icons: {
    icon: [{ url: "/brand-mark.svg?v=20260928", type: "image/svg+xml" }],
    shortcut: [{ url: "/brand-mark.svg?v=20260928", type: "image/svg+xml" }],
    apple: [{ url: "/brand-mark.svg?v=20260928", type: "image/svg+xml" }],
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
        <link rel="icon" href="/brand-mark.svg?v=20260928" type="image/svg+xml" sizes="any" />
        <link rel="shortcut icon" href="/brand-mark.svg?v=20260928" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/brand-mark.svg?v=20260928" />
        {/* Structured data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "X-CAPITAL",
              alternateName: ["X Capital", "X CAPITAL", "X·CAPITAL", "X Investment", "xcapital.investments"],
              url: "https://xcapital.investments",
              logo: "https://xcapital.investments/brand-mark.svg?v=20260928",
              description:
                "X-CAPITAL is a capital desk. Specialties are public markets, private equity, tokenized assets, commerce-capital, AI decision support, infrastructure, and the orbital economy. Published desk access is Quantum at $9,999 per month, Sovereign at $49,999 per month, and Vertex by invitation. Projected yield on the site is illustrative modelling, not a guaranteed earning.",
              knowsAbout: [
                "Public markets",
                "Private equity",
                "Tokenized assets",
                "Commerce-capital",
                "AI decision support",
                "Infrastructure",
                "Orbital economy",
              ],
              sameAs: ["https://xcapital.investments"],
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
              alternateName: ["X Capital", "X CAPITAL", "X Investment", "xcapital.investments"],
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
        {/* ═══ FUTURISTIC SPLASH SCREEN ═══ */}
        <div id="xc-splash" className="xc-splash">
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
        {/* Inline script to dismiss splash after load — no React dependency */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var KEY = location.pathname.indexOf('/admin') === 0 ? 'xc_admin_splash_seen' : 'xc_splash_seen';
                var splash = document.getElementById('xc-splash');
                if (!splash) return;
                splash.style.pointerEvents = 'none';
                try {
                  if (sessionStorage.getItem(KEY)) splash.style.visibility = 'hidden';
                  else sessionStorage.setItem(KEY, '1');
                } catch (e) {}
              })();
            `,
          }}
        />
        <SessionScope />
        <SessionSync />
        {children}
        <TawkChat />
      </body>
    </html>
  );
}
