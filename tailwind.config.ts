import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#010b1a",
          900: "#010b1a",
          850: "#0c1524",
          800: "#0f1827",
          700: "#1a2436",
          600: "#243050",
        },
        panel: {
          DEFAULT: "rgba(255,255,255,0.05)",
          border: "rgba(255,255,255,0.1)",
        },
        brand: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
          light: "#60a5fa",
        },
        success: {
          DEFAULT: "#10b981",
          light: "#34d399",
        },
        warning: {
          DEFAULT: "#fb923c",
          light: "#fdba74",
        },
        danger: {
          DEFAULT: "#fb7185",
          light: "#fda4af",
        },
        muted: "#94a3b8",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Manrope", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(0,0,0,0.4)",
        card: "0 1px 2px rgba(0,0,0,0.3), 0 8px 20px -12px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
