/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070b17',
          900: '#0b1020',
          850: '#0f1528',
          800: '#141c33',
          700: '#1d2742',
          600: '#2a3758',
        },
        mint: {
          300: '#6ff0db',
          400: '#35dec4',
          500: '#14c9ae',
          600: '#0ea98f',
        },
        violet: {
          300: '#b79bff',
          400: '#9a79ff',
          500: '#7c5cff',
          600: '#6344e6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124,92,255,0.25), 0 18px 50px -20px rgba(20,201,174,0.35)',
        card: '0 20px 45px -28px rgba(0,0,0,0.9)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '60%': { opacity: '1', transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both',
        'pop-in': 'pop-in 0.35s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};
