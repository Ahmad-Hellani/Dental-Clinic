/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // high-contrast ink / surface neutrals
        ink: { DEFAULT: "#111827", soft: "#374151", muted: "#6B7280" },
        surface: "#FFFFFF",
        canvas: "#F6F7F9",
        line: { DEFAULT: "#E5E7EB", strong: "#D1D5DB" },
        // clinical blue/teal accent
        brand: {
          50: "#ECFAFB", 100: "#D0F1F4", 200: "#A3E2E8", 500: "#0E9AA7",
          600: "#0B7F8B", 700: "#0A6670", 800: "#0B4F57", 900: "#0B3D44",
        },
        // semantic status pills
        status: {
          "pending-bg": "#FEF3C7", "pending-fg": "#92400E",
          "confirmed-bg": "#DBEAFE", "confirmed-fg": "#1E40AF",
          "completed-bg": "#DCFCE7", "completed-fg": "#166534",
          "cancelled-bg": "#F3F4F6", "cancelled-fg": "#4B5563",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"], // editorial headlines
      },
      borderRadius: { DEFAULT: "0.25rem", md: "0.375rem", lg: "0.5rem" },
      boxShadow: { card: "0 1px 2px rgba(17,24,39,0.05)" },
    },
  },
  plugins: [],
};