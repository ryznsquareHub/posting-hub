import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "var(--bg)",
          1: "var(--bg-1)",
          2: "var(--bg-2)",
          3: "var(--bg-3)",
          hover: "var(--bg-hover)",
          select: "var(--bg-select)",
        },
        border: {
          0: "var(--border-0)",
          1: "var(--border-1)",
          2: "var(--border-2)",
          3: "var(--border-3)",
        },
        text: {
          hi: "var(--text-hi)",
          DEFAULT: "var(--text)",
          mid: "var(--text-mid)",
          lo: "var(--text-lo)",
          dim: "var(--text-dim)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
        },
        status: {
          ok: "var(--ok)",
          warn: "var(--warn)",
          info: "var(--info)",
          danger: "var(--danger)",
        },
      },
      fontFamily: {
        sans: [
          "Geist",
          "ui-sans-serif",
          "-apple-system",
          "system-ui",
          "Apple SD Gothic Neo",
          "Pretendard",
          "sans-serif",
        ],
        mono: [
          "Geist Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      fontSize: {
        // 운영툴 톤 — 기본 13px, 작은건 10.5~11.5
        xxs: ["10.5px", { lineHeight: "1.3" }],
        xs: ["11.5px", { lineHeight: "1.4" }],
        sm: ["12.5px", { lineHeight: "1.45" }],
        base: ["13px", { lineHeight: "1.45" }],
      },
      letterSpacing: {
        tight2: "-0.01em",
        tight3: "-0.02em",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "7px",
        lg: "8px",
      },
      transitionDuration: {
        fast: "80ms",
        DEFAULT: "120ms",
      },
      animation: {
        "row-flash": "rowFlash 1.4s ease-out forwards",
        "live-pulse": "livePulse 1.5s ease-in-out infinite",
      },
      keyframes: {
        rowFlash: {
          "0%": { background: "rgba(58,204,129,0.18)" },
          "100%": { background: "transparent" },
        },
        livePulse: {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
