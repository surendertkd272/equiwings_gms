import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#d9d9de",
          300: "#b9b9c2",
          400: "#8e8e9a",
          500: "#6b6b78",
          600: "#52525c",
          700: "#3f3f48",
          800: "#2a2a31",
          900: "#1b1b21",
        },
        brand: {
          50: "#f0f7ff",
          100: "#deecff",
          500: "#2f6fed",
          600: "#1d57d3",
          700: "#1846a8",
        },
        success: "#16a34a",
        warn: "#d97706",
        danger: "#dc2626",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
