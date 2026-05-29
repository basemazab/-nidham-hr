/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0D1B2A",
          light: "#1B2D45",
          dark: "#080F18",
        },
        accent: {
          DEFAULT: "#C9A84C",
          light: "#D4B96A",
          dark: "#A8893D",
        },
        success: "#10B981",
        error: "#EF4444",
      },
      fontFamily: {
        heading: ["Cairo", "sans-serif"],
        body: ["Tajawal", "sans-serif"],
      },
    },
  },
  plugins: [],
};
