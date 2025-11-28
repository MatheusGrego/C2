/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'void': {
          900: '#0e0e15',
          800: '#1c1437',
          700: '#1f1942',
          600: '#19153f',
        },
        'neon': {
          pink: '#eb055a',
          purple: '#4632f0',
          green: '#00ff88',
          red: '#ff4444',
          orange: '#ffaa00',
        },
        'sentinel': {
          border: '#463f6a',
          text: '#68648c',
          muted: '#7a7a8e',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Roboto Mono', 'Consolas', 'monospace'],
        'display': ['Rajdhani', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'glitch': 'glitch 2s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'gradient-x': 'gradient-x 5s ease infinite',
        'blink': 'blink 1s step-end infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        'glitch': {
          '0%, 100%': { textShadow: 'none' },
          '25%': { textShadow: '-1.5px -1.5px 0 #eb055a, 1.5px 1.5px 0 #4632f0' },
          '50%': { textShadow: '1.5px -1.5px 0 #eb055a, -1.5px 1.5px 0 #4632f0' },
          '75%': { textShadow: '-1.5px 1.5px 0 #eb055a, 1.5px -1.5px 0 #4632f0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'neon-pink': '0 0 10px rgba(235, 5, 90, 0.5)',
        'neon-pink-lg': '0 0 20px rgba(235, 5, 90, 0.6)',
        'neon-purple': '0 0 10px rgba(70, 50, 240, 0.5)',
        'neon-green': '0 0 10px rgba(0, 255, 136, 0.5)',
        'neon-red': '0 0 10px rgba(255, 68, 68, 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-sentinel': 'linear-gradient(90deg, #4632f0, #eb055a)',
      },
    },
  },
  plugins: [],
}
