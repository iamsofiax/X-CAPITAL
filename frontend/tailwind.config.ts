import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors — X Black Aesthetic
        "xc-black": "#000000",
        "xc-dark": "#0a0a0a",
        "xc-card": "#111111",
        "xc-border": "#222222",
        // Node Engine — thick orbital palette
        "node-bg": "#050505",
        "node-panel": "#0c0c0c",
        "node-panel-up": "#111111",
        "node-border": "#1a1a1a",
        "node-signal": "#10b981",
        "node-locked": "#d97706",
        "xc-purple": "#e7e9ea",
        "xc-purple-light": "#d4d4d4",
        "xc-gold": "#d97706",
        "xc-gold-light": "#fbbf24",
        "xc-cyan": "#a3a3a3",
        "xc-green": "#10b981",
        "xc-red": "#ef4444",
        "xc-text": "#f5f5f5",
        "xc-muted": "#525252",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "xc-hero": "radial-gradient(ellipse at top, #0a0a0a 0%, #000000 60%)",
        "xc-card-glow":
          "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
      },
      boxShadow: {
        "xc-glow": "0 0 30px rgba(255, 255, 255, 0.05)",
        "xc-card": "0 4px 24px rgba(0, 0, 0, 0.8)",
        "xc-purple": "0 0 20px rgba(255, 255, 255, 0.08)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
