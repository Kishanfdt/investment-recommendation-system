/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0a0e1a",
          900: "#0f1729",
          800: "#161f38",
          700: "#1f2b4d",
          600: "#2a3a63",
        },
        gold: {
          400: "#e8c26a",
          500: "#d4a94a",
          600: "#b8892f",
        },
      },
      fontFamily: {
        serif: ["Lora", "serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}