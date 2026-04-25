/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.25rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '3rem',
      },
    },
    extend: {
      colors: {
        ink: '#0d2740',
        navy: '#143a59',
        slate: '#587089',
        mist: '#e4eef5',
        lake: '#8bb7d4',
        foam: '#f7fbff',
        sand: '#f2e7d3',
        line: 'rgba(20, 58, 89, 0.11)',
        gold: '#c6a46b',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Cormorant Garamond', 'serif'],
      },
      boxShadow: {
        soft: '0 20px 50px rgba(20, 58, 89, 0.08)',
        panel: '0 32px 90px rgba(20, 58, 89, 0.12)',
      },
      backgroundImage: {
        'hero-overlay':
          'linear-gradient(180deg, rgba(13, 39, 64, 0.14) 0%, rgba(13, 39, 64, 0.46) 46%, rgba(13, 39, 64, 0.82) 100%)',
        'section-glow':
          'radial-gradient(circle at top, rgba(139, 183, 212, 0.28), transparent 58%)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
