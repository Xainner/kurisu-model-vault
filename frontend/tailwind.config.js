/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
              vault: {
                50:'#fdf2f2',100:'#fce7e7',200:'#fac5c5',300:'#f8a4a4',
                400:'#f57777',500:'#8B1A1A',600:'#7a1818',700:'#691515',
                800:'#581212',900:'#470f0f',950:'#2d0a0a',
              },
              kurisu: {
                red: '#8B1A1A',
                maroon: '#6B1010',
                cyan: '#4ECDC4',
                cream: '#F5F0E6',
                dark: '#2D2D2D',
              },
              dark: {
                bg:'#0a0a0f', card:'#12121a', border:'#1e1e2e',
                hover:'#1a1a2e', text:'#e2e8f0', muted:'#64748b',
              },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'gradient': 'gradient 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
                  '0%': { boxShadow: '0 0 5px rgba(139, 26, 26, 0.3)' },
                  '100%': { boxShadow: '0 0 20px rgba(78, 205, 196, 0.6)' },
                },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
