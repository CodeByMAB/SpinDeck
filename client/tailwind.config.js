/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neon brand
        primary:  '#A855F7',         // bright purple (neon)
        'primary-deep': '#6B21A8',   // deep purple
        cyan:     '#00D9FF',         // electric cyan
        magenta:  '#FF2D8E',         // hot magenta

        // Ink palette (warm-tinted near-blacks)
        ink: {
          0:  '#07040C',
          50: '#0A0612',
          100:'#0D0820',
          200:'#160B2A',
          300:'#1E1138',
          400:'#2A1A4E',
        },
        line:   '#3A2266',
        'line-2':'#5B36A0',

        // Text
        'tx-hi':   '#F7F2FF',
        'tx-md':   '#B7A5D9',
        'tx-lo':   '#6B5A8E',
        'tx-mute': '#3F3060',

        // Aliases for legacy class names already in components
        dark:   '#0D0820',
        darker: '#07040C',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple':  '0 0 24px rgba(168,85,247,0.55), 0 12px 28px rgba(107,33,168,0.45)',
        'glow-cyan':    '0 0 24px rgba(0,217,255,0.6),  0 12px 28px rgba(0,217,255,0.3)',
        'glow-magenta': '0 0 24px rgba(255,45,142,0.5), 0 12px 28px rgba(255,45,142,0.3)',
      },
      animation: {
        'vinyl-spin': 'vinyl-spin 6s linear infinite',
        'eq-bounce':  'eq-bounce 0.9s ease-in-out infinite',
        'beat':       'beat 2s ease-out infinite',
        'pulse-dot':  'pulse-dot 1.2s ease-in-out infinite',
        'scan':       'scan 3s ease-in-out infinite',
      },
      keyframes: {
        'vinyl-spin': { to: { transform: 'rotate(360deg)' } },
        'eq-bounce':  { '0%,100%': { height: '30%' }, '50%': { height: '100%' } },
        'beat':       { '0%': { transform: 'scale(1)', opacity: '0.8' }, '100%': { transform: 'scale(1.6)', opacity: '0' } },
        'pulse-dot':  { '50%': { opacity: '0.4', transform: 'scale(0.85)' } },
        'scan':       { '0%': { transform: 'translateY(-100%)', opacity: '0' }, '10%': { opacity: '1' }, '100%': { transform: 'translateY(220%)', opacity: '0' } },
      },
    },
  },
  plugins: [],
}
