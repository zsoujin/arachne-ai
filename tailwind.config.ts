import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        base: {
          950: "#08090b",
          900: "#0c0e11",
          850: "#101216",
          800: "#15181d",
          700: "#1c2026",
          600: "#262b32",
          500: "#343a42",
          400: "#4a515b",
        },
        ink: {
          100: "#eef0f2",
          200: "#dadde2",
          300: "#b6bcc4",
          400: "#8b929c",
          500: "#666d76",
          600: "#4a5057",
        },
        steel: {
          950: "#0e1a2b",
          900: "#132743",
          800: "#1a3559",
          700: "#204373",
          600: "#2c5691",
          500: "#4576b8",
          400: "#6f97cd",
          300: "#9dbadf",
        },
        amber: {
          500: "#d1963f",
          400: "#e0ac5f",
        },
        rose: {
          600: "#c1454a",
          500: "#e0555b",
        },
        moss: {
          500: "#4e9c78",
          400: "#6cb794",
        },
        border: "#1f232a",
        ring: "#2c5691",
      },
      borderRadius: {
        xl: "0.85rem",
        "2xl": "1.1rem",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.02) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(69,118,184,0.25), 0 0 24px -4px rgba(69,118,184,0.25)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "lock-pulse": {
          "0%": { transform: "scale(1.1)", opacity: "0.3" },
          "55%": { transform: "scale(0.98)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
        scan: "scan 4s linear infinite",
        "fade-in": "fade-in 0.25s ease-out",
        shimmer: "shimmer 1.6s infinite linear",
        "lock-pulse": "lock-pulse 0.55s cubic-bezier(0.34,1.56,0.64,1)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
