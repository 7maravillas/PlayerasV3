/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0b0b0c',
        'neon-teal': '#00d2d3',
        'gray-text': '#a1a1aa',
        'gray-light': '#e4e4e7',
      },
    },
  },
  plugins: [],
}
