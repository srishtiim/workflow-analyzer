/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#FAFAFA',
        surface: '#FFFFFF',
        primary: '#111111',
        danger: '#EF4444',
        success: '#22C55E',
        muted: '#6B7280',
        border: '#E5E7EB',
      }
    },
  },
  plugins: [],
}
