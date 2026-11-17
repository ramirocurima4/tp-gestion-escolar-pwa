/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 28px rgba(34, 211, 238, 0.5)',
        'neon-pink': '0 0 24px rgba(244, 114, 182, 0.45)',
        'neon-amber': '0 0 24px rgba(251, 191, 36, 0.45)',
        'neon-red': '0 0 24px rgba(244, 63, 94, 0.45)',
      },
    },
  },
  plugins: [],
}
