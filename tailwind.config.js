/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Core backgrounds
        base: "#0a0a0f",
        panel: "#111118",
        elevated: "#16161f",
        card: "#1c1c28",
        // Borders
        border: {
          subtle: "rgba(255,255,255,0.07)",
          DEFAULT: "rgba(255,255,255,0.10)",
          strong: "rgba(255,255,255,0.16)",
        },
        // Text
        ink: {
          primary: "#f0f0f4",
          secondary: "#9898a8",
          muted: "#606070",
        },
        // Accents
        accent: {
          blue: "#4f8ef7",
          "blue-dim": "rgba(79,142,247,0.12)",
          green: "#3ecf8e",
          "green-dim": "rgba(62,207,142,0.10)",
          purple: "#a78bfa",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
        // Legacy compat
        background: "#0a0a0f",
        surface: {
          DEFAULT: "#111118",
          50: "#111118",
          100: "#16161f",
          200: "#1c1c28",
          300: "#24243a",
          border: "rgba(255,255,255,0.10)",
          hover: "#212132",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", "ui-monospace", "Consolas", "monospace"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        "glow-blue": "0 0 20px rgba(79,142,247,0.15)",
        "glow-green": "0 0 20px rgba(62,207,142,0.12)",
        "panel": "0 0 0 1px rgba(255,255,255,0.07), 0 8px 32px rgba(0,0,0,0.4)",
      },
      animation: {
        "fade-in": "fadeSlideUp 0.2s ease-out",
        "blink": "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};
