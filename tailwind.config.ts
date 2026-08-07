import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0a0e1a",
          900: "#0d1220",
          850: "#101627",
          800: "#141b2e",
          700: "#1b2438",
          600: "#243050",
        },
        panel: {
          DEFAULT: "#141b2e",
          border: "#232c44",
        },
        brand: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
          light: "#60a5fa",
        },
        success: {
          DEFAULT: "#22c55e",
          light: "#4ade80",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#fbbf24",
        },
        danger: {
          DEFAULT: "#ef4444",
          light: "#f87171",
        },
        muted: "#8b95ab",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Rajdhani", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(0,0,0,0.4)",
        card: "0 1px 2px rgba(0,0,0,0.3), 0 8px 20px -12px rgba(0,0,0,0.5)",
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
