"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[X-CAPITAL Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#08080c] flex items-center justify-center p-4">
      <div className="bg-[#0f0f14] border border-red-500/30 rounded-2xl p-8 max-w-lg w-full text-center">
        <div className="text-red-500 text-4xl mb-4">⚠</div>
        <h2 className="text-xl font-bold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-400 mb-4 break-all font-mono bg-black/40 rounded-lg p-3 text-left">
          {error.message || "Unknown error"}
        </p>
        {error.stack && (
          <details className="text-left mb-4">
            <summary className="text-gray-500 text-xs cursor-pointer">
              Stack trace
            </summary>
            <pre className="text-gray-600 text-[10px] font-mono whitespace-pre-wrap break-all mt-2">
              {error.stack}
            </pre>
          </details>
        )}
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-white/[0.08] hover:bg-white/[0.14] text-white rounded-lg text-sm font-bold transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
