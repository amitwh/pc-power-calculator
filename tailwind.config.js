/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#e5461f',
          dark: '#c93a18',
          text: '#a82d15',
          light: '#ff6b47',
        },
        success: '#1a7a56',
        warning: 'hsl(45,93%,47%)',
        danger: 'hsl(0,84%,60%)',
        info: 'hsl(199,89%,48%)',
        gray: {
          50: '#fafbfc', 100: '#f1f3f5', 200: '#e6e8eb',
          300: '#cfd4d9', 400: '#9aa3ad', 500: '#6b7682',
          600: '#4b5563', 700: '#374151', 800: '#1f2937',
          900: '#111827', 950: '#0d0b09',
        },
      },
      fontFamily: {
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        numeric: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: { 4: '4px', 8: '8px', 12: '12px', 16: '16px' },
    },
  },
  plugins: [],
};
