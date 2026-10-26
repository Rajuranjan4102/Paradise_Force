/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          950: '#070A12',
          900: '#0B0F19',
          850: '#0E1626',
          800: '#141E34',
          700: '#1E2C4A',
          600: '#2A3C63',
        },
        cyan: {
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          glow: '#00F0FF',
        },
        electric: {
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          glow: '#38BDF8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.25)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.25)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.35)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
      },
    },
  },
  plugins: [],
};
