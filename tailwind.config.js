/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canva: {
          purple: '#7C3AED',
          teal: '#00C4CC',
          bg: '#F8F8F8',
          card: '#FFFFFF',
        },
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
}
