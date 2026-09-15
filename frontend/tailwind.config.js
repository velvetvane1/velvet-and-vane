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
          // Token kept as "gold" (referenced ~500 times across the app as
          // text-gold, bg-gold, border-gold/40, etc.) but re-valued to the
          // new black + orange identity, so every existing usage updates
          // automatically instead of requiring a find/replace of class names.
          pale: '#E8DFD1',
          DEFAULT: '#C6A15B',
          deep: '#A97835',
          line: 'rgba(201, 164, 92, 0.35)',
        },
        primary: '#2C2925',
        charcoal: '#2C2925',
        ember: {
          DEFAULT: '#5B1A1A',
          light: '#7A2A20',
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
        'gold-sheen': 'linear-gradient(115deg, #A8813F 0%, #E4D1A7 32%, #C9A45C 52%, #F8F5EE 68%, #A8813F 100%)',
        'noir-radial': 'radial-gradient(circle at 70% 25%, #FFFDF9 0%, #F8F5EF 62%, #E8DFD1 100%)',
      },
      boxShadow: {
        gold: '0 16px 36px -22px rgba(18,60,53,0.45)',
        glass: '0 12px 30px -24px rgba(23,26,24,0.35)',
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
