import type { Metadata } from "next";
import TawkChat from "@/components/support/TawkChat";
import SessionSync from "@/components/SessionSync";
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
              <div className="xc-splash-icon">
                <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  <path d="M12 12l6-6" stroke="green" strokeWidth="2" />
                </svg>
              </div>
            </div>
            {/* Loading bar */}
            <div className="xc-splash-bar-track">
              <div className="xc-splash-bar-fill" />
            </div>
            <div className="xc-splash-status">
              INITIALIZING SYSTEMS
              <span className="xc-splash-dots" />
            </div>
          </div>
        </div>
        {/* Inline script to dismiss splash after load — no React dependency */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var splash = document.getElementById('xc-splash');
                if (!splash) return;
                function dismiss() {
                  splash.classList.add('xc-splash-exit');
                  setTimeout(function() { splash.remove(); }, 600);
                }
                // Dismiss when page is interactive OR after 2.8s max
                if (document.readyState === 'complete') { setTimeout(dismiss, 400); }
                else { window.addEventListener('load', function() { setTimeout(dismiss, 400); }); }
                setTimeout(dismiss, 2800);
              })();
            `,
          }}
        />
        <SessionSync />
        {children}
        <TawkChat />
      </body>
    </html>
  );
}
