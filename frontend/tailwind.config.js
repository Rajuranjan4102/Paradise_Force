/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#FAF8F5',
          100: '#F5F1E8',
          200: '#EBE5D8',
          300: '#DDD5C4',
          400: '#C5BAA5',
          500: '#A49680',
          600: '#837662',
          700: '#645948',
          800: '#473E32',
          900: '#2E271F',
        },
        paper: {
          canvas: '#F8F6F1',
          card: '#FFFFFF',
          subtle: '#FAF7F2',
          muted: '#F2EDE4',
          border: '#E5DFD3',
          borderStrong: '#D5CCA7',
        },
        command: {
          950: '#F5F2EB',
          900: '#FAF7F2',
          850: '#FFFFFF',
          800: '#E8E3D8',
          700: '#D8D1C2',
          600: '#8C8270',
        },
        cyan: {
          400: '#0284C7',
          500: '#0369A1',
          600: '#075985',
          glow: '#38BDF8',
        },
        electric: {
          400: '#2563EB',
          500: '#1D4ED8',
          600: '#1E40AF',
          glow: '#60A5FA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(50, 40, 30, 0.05), 0 1px 2px rgba(50, 40, 30, 0.03)',
        'warm-md': '0 4px 14px rgba(50, 40, 30, 0.06), 0 2px 4px rgba(50, 40, 30, 0.02)',
        'warm-lg': '0 12px 28px rgba(50, 40, 30, 0.08), 0 4px 8px rgba(50, 40, 30, 0.03)',
        'warm-xl': '0 20px 40px rgba(50, 40, 30, 0.12), 0 8px 16px rgba(50, 40, 30, 0.04)',
      },
    },
  },
  plugins: [],
};
