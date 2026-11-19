/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0b0f19",
        surface: {
          DEFAULT: "#111827",
          50: "#0f172a",
          100: "#1e293b",
          200: "#334155",
          300: "#475569",
          border: "rgba(255, 255, 255, 0.08)",
          hover: "#1e293b",
        },
        brand: {
          cyan: "#38bdf8",
          blue: "#3b82f6",
          purple: "#a855f7",
          emerald: "#10b981",
        },
      },
    },
  },
  plugins: [],
};
