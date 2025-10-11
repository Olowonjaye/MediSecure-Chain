/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#009688",   // medical green
        secondary: "#00695c", // deep secure green
      },
    },
  },
  safelist: [
    'bg-indigo-50','bg-indigo-600','bg-indigo-100','bg-white/10','bg-white/20','translate-x-1','hover:translate-x-1','hover:bg-indigo-50','hover:scale-105','shadow-md','shadow-sm','rounded-2xl','rounded-xl','border-l-4','text-white/90','text-white/70','from-indigo-600','via-purple-600','to-pink-500'
  ],
  plugins: [],
}
