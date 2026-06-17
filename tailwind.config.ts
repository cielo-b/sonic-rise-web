import type { Config } from 'tailwindcss'

/**
 * SonicRise Cinematic Studio — Design System
 * Tailwind v4: this file is loaded by globals.css via `@config "../../tailwind.config.ts"`.
 * All design tokens defined here become available as Tailwind utilities.
 */
const config: Config = {
  darkMode: 'class',

  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],

  theme: {
    extend: {
      // ─── Colors ─────────────────────────────────────────────────────────────
      colors: {
        // Backgrounds
        'bg-main':    '#0B0B0F',   // Foundational matte black
        'bg-surface': '#13131A',   // Card / panel surface
        'bg-alt':     '#1A1A22',   // Alternate sections

        // Brand accents
        'brand-purple': '#7C3AED', // Energy — primary CTA
        'brand-cyan':   '#00D4FF', // Precision — technical elements
        'brand-gold':   '#D4AF37', // Premium — membership / awards

        // Text
        'text-primary': '#E4E1EC', // Default body copy
        'text-muted':   '#C8C5CB', // Secondary / metadata

        // Full Material-derived palette (from DESIGN.md)
        'surface':                    '#13131A',
        'surface-dim':                '#13131A',
        'surface-bright':             '#393841',
        'surface-container-lowest':   '#0D0E15',
        'surface-container-low':      '#1B1B23',
        'surface-container':          '#1F1F27',
        'surface-container-high':     '#292932',
        'surface-container-highest':  '#34343D',
        'on-surface':                 '#E4E1EC',
        'on-surface-variant':         '#C8C5CB',
        'inverse-surface':            '#E4E1EC',
        'inverse-on-surface':         '#303038',
        'outline':                    '#929095',
        'outline-variant':            '#47464B',
        'surface-tint':               '#C8C5CB',
        'primary':                    '#C8C5CB',
        'on-primary':                 '#303034',
        'primary-container':          '#0B0B0F',
        'on-primary-container':       '#7B797E',
        'inverse-primary':            '#5F5E63',
        'secondary':                  '#D2BBFF',
        'on-secondary':               '#3F008E',
        'secondary-container':        '#6001D1',
        'on-secondary-container':     '#C9AEFF',
        'tertiary':                   '#3CD7FF',
        'on-tertiary':                '#003642',
        'tertiary-container':         '#000D12',
        'on-tertiary-container':      '#0085A1',
        'error':                      '#FFB4AB',
        'on-error':                   '#690005',
        'error-container':            '#93000A',
        'on-error-container':         '#FFDAD6',
        'primary-fixed':              '#E4E1E7',
        'primary-fixed-dim':          '#C8C5CB',
        'on-primary-fixed':           '#1B1B1F',
        'on-primary-fixed-variant':   '#47464B',
        'secondary-fixed':            '#EADDFF',
        'secondary-fixed-dim':        '#D2BBFF',
        'on-secondary-fixed':         '#25005A',
        'on-secondary-fixed-variant': '#5A00C6',
        'tertiary-fixed':             '#B4EBFF',
        'tertiary-fixed-dim':         '#3CD7FF',
        'on-tertiary-fixed':          '#001F27',
        'on-tertiary-fixed-variant':  '#004E5F',
      },

      // ─── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        headline: ['var(--font-sora)',       'sans-serif'],
        body:     ['var(--font-geist)',      'sans-serif'],
        mono:     ['var(--font-jetbrains)',  'monospace'],
      },

      fontSize: {
        // Display & headline scale (from DESIGN.md)
        'display-lg': ['4.5rem',  { lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '800' }],
        'headline-lg': ['3rem',   { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['2rem',   { lineHeight: '1.3', fontWeight: '600' }],
        'headline-sm': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg':     ['1.125rem', { lineHeight: '1.6' }],
        'body-md':     ['1rem',     { lineHeight: '1.6' }],
        'label-md':    ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.05em', fontWeight: '500' }],
        'label-sm':    ['0.75rem',  { lineHeight: '1.4', letterSpacing: '0.05em', fontWeight: '500' }],
      },

      // ─── Border radius ───────────────────────────────────────────────────────
      borderRadius: {
        sm:      '0.25rem',
        DEFAULT: '0.5rem',
        md:      '0.75rem',
        lg:      '1rem',
        xl:      '1.5rem',
        full:    '9999px',
      },

      // ─── Spacing ─────────────────────────────────────────────────────────────
      // Custom section-level rhythm
      spacing: {
        'section-xs': '4px',
        'section-sm': '12px',
        'section-md': '24px',
        'section-lg': '48px',
        'section-xl': '80px',
        'gutter':     '32px',
      },

      // ─── Max widths ──────────────────────────────────────────────────────────
      maxWidth: {
        studio: '1440px',
      },

      // ─── Box shadows (emissive glow system) ──────────────────────────────────
      boxShadow: {
        'hero-glow': '0 0 40px -10px rgba(124, 58, 237, 0.3)',   // Purple — primary priority
        'cyan-glow': '0 0 20px -5px rgba(0, 212, 255, 0.3)',     // Cyan — precision
        'gold-glow': '0 0 20px -5px rgba(212, 175, 55, 0.3)',    // Gold — premium
      },

      // ─── Keyframe animations ─────────────────────────────────────────────────
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 40px -10px rgba(124, 58, 237, 0.3)' },
          '50%':      { boxShadow: '0 0 60px -5px rgba(124, 58, 237, 0.5)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up':    'fade-up 0.6s ease-out both',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
      },
    },
  },

  plugins: [],
}

export default config
