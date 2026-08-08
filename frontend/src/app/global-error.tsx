"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[X-CAPITAL Global Error]", error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <html lang="en" className="dark">
      <body
        style={{
          background: "#08080c",
          margin: 0,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#0f0f14",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 16,
              padding: 32,
              maxWidth: 480,
              width: "100%",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#ef4444", fontSize: 40, marginBottom: 16 }}>
              ⚠
            </div>
            <h2
              style={{
                color: "#fff",
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                color: "#9ca3af",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {isDev
                ? error.message || "Unknown error"
                : "A critical error occurred. Please refresh the page or contact support."}
            </p>
            {isDev && error.stack && (
              <details style={{ textAlign: "left", marginBottom: 16 }}>
                <summary
                  style={{ color: "#6b7280", fontSize: 12, cursor: "pointer" }}
                >
                  Stack trace
                </summary>
                <pre
                  style={{
                    color: "#6b7280",
                    fontSize: 10,
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    marginTop: 8,
                  }}
                >
                  {error.stack}
                </pre>
              </details>
            )}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={reset}
                style={{
                  padding: "10px 24px",
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
              <a
                href="/dashboard"
                style={{
                  padding: "10px 24px",
                  background: "rgba(16,185,129,0.15)",
                  color: "#34d399",
                  border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

    <html lang="en" className="dark">
      <body
        style={{
          background: "#08080c",
          margin: 0,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#0f0f14",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 16,
              padding: 32,
              maxWidth: 480,
              width: "100%",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#ef4444", fontSize: 40, marginBottom: 16 }}>
              ⚠
            </div>
            <h2
              style={{
                color: "#fff",
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                color: "#9ca3af",
                fontSize: 13,
                fontFamily: "monospace",
                background: "rgba(0,0,0,0.4)",
                borderRadius: 8,
                padding: 12,
                textAlign: "left",
                wordBreak: "break-all",
                marginBottom: 16,
              }}
            >
              {error.message || "Unknown error"}
            </p>
            {error.stack && (
              <details style={{ textAlign: "left", marginBottom: 16 }}>
                <summary
                  style={{ color: "#6b7280", fontSize: 12, cursor: "pointer" }}
                >
                  Stack trace
                </summary>
                <pre
                  style={{
                    color: "#6b7280",
                    fontSize: 10,
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    marginTop: 8,
                  }}
                >
                  {error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={reset}
              style={{
                padding: "10px 24px",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
