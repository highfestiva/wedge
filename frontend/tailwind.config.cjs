/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0f172a",
          soft: "#020617",
          subtle: "#111827",
        },
        accent: {
          DEFAULT: "#38bdf8",
          soft: "#0ea5e9",
        },
      },
      boxShadow: {
        subtle: "0 10px 30px rgba(15,23,42,0.35)",
      },
    },
  },
  plugins: [],
};

