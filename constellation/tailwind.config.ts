import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#030712',
          900: '#060d1f',
          800: '#0a1628',
          700: '#0f1f38',
          600: '#162740',
        },
        mvsd: {
          green: '#008544',
          gold: '#f59e0b',
        },
        goal: {
          belonging: '#7c3aed',
          foundations: '#008544',
          mastery: '#2563eb',
          future: '#d97706',
        },
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 60s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config
