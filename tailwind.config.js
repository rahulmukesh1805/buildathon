/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#09090B',
          900: '#18181B',
          800: '#27272A',
          700: '#3F3F46',
          600: '#52525B',
          50: '#FAFAFA',
        },
        civic: {
          teal: '#09090B',
          tealDark: '#18181B',
          tealLight: '#F4F4F5',
          accent: '#27272A',
          slate: '#52525B',
          light: '#FAFAFA',
        },
        hazard: {
          critical: '#09090B',
          criticalBg: '#F4F4F5',
          criticalBorder: '#D4D4D8',
          medium: '#27272A',
          mediumBg: '#FAFAFA',
          mediumBorder: '#E4E4E7',
          low: '#52525B',
          lowBg: '#FFFFFF',
          lowBorder: '#E4E4E7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'modal': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [],
}
