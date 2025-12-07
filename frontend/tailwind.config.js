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
        primary: {
          dark: '#1A365D',
          main: '#2B6CB0',
          light: '#4299E1',
        },
        performance: {
          red: '#E53E3E',
          orange: '#ED8936',
          yellow: '#ECC94B',
          green: '#48BB78',
        },
        neutral: {
          900: '#1A202C',
          700: '#4A5568',
          500: '#718096',
          300: '#E2E8F0',
          100: '#F7FAFC',
        },
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body: ['Source Sans Pro', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

