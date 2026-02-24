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
        bio: {
          primary: '#1A56DB',
          background: '#FFFFFF',
          surface: '#F3F4F6',
          text: '#111827',
          muted: '#6B7280',
          border: '#E5E7EB',
          success: '#059669',
        },
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
}
