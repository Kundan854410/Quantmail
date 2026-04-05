/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'cyber-blue': '#00f5ff',
        'cyber-purple': '#8b5cf6',
        'cyber-green': '#39ff14',
        'cyber-dark': '#0a0a0f',
        'cyber-darker': '#050508',
        'cyber-panel': '#0d0d1a',
        'cyber-border': '#1a1a3e',
      },
    },
  },
  plugins: [],
}
