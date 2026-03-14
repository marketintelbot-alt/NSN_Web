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
        ink: '#06131f',
        navy: '#0b2235',
        slate: '#5f7080',
        mist: '#dce6ec',
        lake: '#7fa4b8',
        foam: '#f7fafc',
        line: 'rgba(9, 27, 42, 0.11)',
        gold: '#b79b73',
      },
      fontFamily: {
        sans: ['Source Sans 3', 'sans-serif'],
        display: ['Libre Baskerville', 'serif'],
      },
      boxShadow: {
        soft: '0 22px 48px rgba(7, 22, 34, 0.08)',
        panel: '0 28px 70px rgba(4, 18, 30, 0.12)',
      },
      backgroundImage: {
        'hero-overlay':
          'linear-gradient(180deg, rgba(6, 19, 31, 0.22) 0%, rgba(6, 19, 31, 0.62) 48%, rgba(6, 19, 31, 0.88) 100%)',
        'section-glow':
          'radial-gradient(circle at top, rgba(127, 164, 184, 0.22), transparent 58%)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
