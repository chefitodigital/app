/**
 * PALETA DE CORES OFICIAL
 *
 * Esta configuração define as ÚNICAS cores permitidas na aplicação.
 *
 * CORES APROVADAS:
 * - Gray Scale (50-950): Para todos os tons neutros
 * - Accent: Cor de destaque configurável (via CSS custom properties)
 *
 * CORES PROIBIDAS (NUNCA USAR):
 * ❌ Branco/Preto puros: white, black, #ffffff, #000000
 * ❌ Cores específicas: red, blue, green, yellow, purple, indigo, violet, pink, orange
 *
 * SUBSTITUIÇÕES CORRETAS:
 * - bg-white    → bg-gray-50
 * - text-white  → text-gray-50
 * - bg-black    → bg-gray-950
 * - text-black  → text-gray-950
 * - bg-red-*    → bg-accent
 * - text-red-*  → text-accent
 *
 * Para mais detalhes, consulte o arquivo docs/DESIGN.md.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: 'var(--color-accent)',
        gray: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#6c757d',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
          950: '#121417',
        },
      },
      fontFamily: {
        title: ['var(--font-title)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        button: ['var(--font-button)', 'sans-serif'],
      },
      fontSize: {
        xs: ['var(--font-size-caption)', { lineHeight: '1.25rem' }],
        sm: ['var(--font-size-detail)', { lineHeight: '1.25rem' }],
        base: ['var(--font-size-body)', { lineHeight: '1.5rem' }],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'inner-lg': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'soft': 'var(--shadow-rest)',
        'soft-md': 'var(--shadow-rest)',
        'soft-lg': 'var(--shadow-raised)',
        'soft-xl': 'var(--shadow-overlay)',
        'card': 'var(--shadow-rest)',
        'card-hover': 'var(--shadow-raised)',
        DEFAULT: 'var(--shadow-rest)',
        'sm': 'var(--shadow-rest)',
        'md': 'var(--shadow-rest)',
        'lg': 'var(--shadow-raised)',
        'xl': 'var(--shadow-raised)',
        '2xl': 'var(--shadow-overlay)',
      },
      animation: {
        'bounce-slow': 'bounce 3s linear infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        '4xl': '2rem',
      },
      scale: {
        '102': '1.02',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
  corePlugins: {
    ringWidth: false,
    ringColor: false,
    ringOffsetWidth: false,
    ringOffsetColor: false,
    outline: false,
  }
};
