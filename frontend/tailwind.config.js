/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // These resolve through CSS variables (defined in index.css) so the
        // SAME utility classes used everywhere in the app — bg-obsidian,
        // text-ivory/70, etc. — automatically invert between dark and
        // light themes instead of needing dark:/light: variants on every
        // one of the ~500 usages across the codebase.
        obsidian: {
          DEFAULT: 'rgb(var(--c-obsidian) / <alpha-value>)',
          light: 'rgb(var(--c-obsidian-light) / <alpha-value>)',
          lighter: 'rgb(var(--c-obsidian-lighter) / <alpha-value>)',
        },
        ivory: {
          DEFAULT: 'rgb(var(--c-ivory) / <alpha-value>)',
          dim: 'rgb(var(--c-ivory-dim) / <alpha-value>)',
        },
        gold: {
          // Champagne accent with burgundy deep state for existing utilities.
          pale: '#E8DCCB',
          DEFAULT: '#C9A46C',
          deep: '#7A1833',
          line: 'rgba(201, 164, 108, 0.35)',
        },
        primary: '#5A0F24',
        charcoal: '#191517',
        ember: {
          DEFAULT: '#5A0F24',
          light: '#7A1833',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Montserrat"', 'sans-serif'],
        script: ['"Playfair Display"', 'serif'],
      },
      letterSpacing: {
        widest2: '0.35em',
        widest3: '0.5em',
      },
      backgroundImage: {
        'gold-sheen': 'linear-gradient(115deg, #5A0F24 0%, #7A1833 52%, #5A0F24 100%)',
        'noir-radial': 'radial-gradient(circle at 70% 25%, #FFFFFF 0%, #F7F1E8 62%, #E8DCCB 100%)',
      },
      boxShadow: {
        gold: '0 16px 36px -22px rgba(90,15,36,0.22)',
        glass: '0 12px 30px -24px rgba(25,21,23,0.25)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'gold-shimmer': 'shimmer 3.5s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(40px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
