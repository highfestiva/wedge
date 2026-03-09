/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#38bdf8",
          soft: "#0ea5e9",
        },
        t: {
          bg: "var(--t-bg)",
          surface: "var(--t-surface)",
          card: "var(--t-card)",
          "card-hover": "var(--t-card-hover)",
          input: "var(--t-input)",
          inset: "var(--t-inset)",
          "ghost-hover": "var(--t-ghost-hover)",
          badge: "var(--t-badge)",
          avatar: "var(--t-avatar)",
          text: "var(--t-text)",
          heading: "var(--t-text-heading)",
          secondary: "var(--t-text-secondary)",
          tertiary: "var(--t-text-tertiary)",
          muted: "var(--t-text-muted)",
          faint: "var(--t-text-faint)",
          dim: "var(--t-text-dim)",
          separator: "var(--t-text-separator)",
          ghost: "var(--t-text-ghost)",
          border: "var(--t-border)",
          "border-strong": "var(--t-border-strong)",
          "border-subtle": "var(--t-border-subtle)",
          "border-card": "var(--t-border-card)",
          "border-input": "var(--t-border-input)",
          "border-hover": "var(--t-border-hover)",
          "ring-offset": "var(--t-ring-offset)",
          "focus-bg": "var(--t-focus-bg)",
          "error-bg": "var(--t-error-bg)",
          "error-border": "var(--t-error-border)",
          "error-text": "var(--t-error-text)",
        },
      },
      boxShadow: {
        subtle: "0 10px 30px rgba(15,23,42,0.35)",
      },
    },
  },
  plugins: [],
};

