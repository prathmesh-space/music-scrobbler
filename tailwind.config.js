/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'heading': ['Nunito', 'sans-serif'],
        'body': ['Baloo 2', 'sans-serif'],
        'sans': ['Baloo 2', 'sans-serif'],
      },
      colors: {
        cream: '#FDF6EC',
        coral: '#FF6B6B',
        teal: '#4ECDC4',
        dark: '#1A1A1A',
        plum: '#463239',
        orange: '#FF8D28',
      },
    },
  },
  plugins: [],
}
