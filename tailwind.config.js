/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {    
      colors: {
        background: "#f9fafb",
        foreground: "#111827",
        border: "#e5e7eb",
        input: "#d1d5db",
        accent: "#3b82f6",
        "accent-foreground": "#ffffff",
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8fafc',
        },
      },
    },
  },
  plugins: [],
}
