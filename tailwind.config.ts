import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

export default {
  // presets: [pxToRem],
  presets: [require('tailwindcss-preset-px-to-rem')],
  content: ['./src/**/*.{js,ts,jsx,tsx}', './public/**/*.html'],
  theme: {
    fontFamily: {
      pretendard: ['Pretendard', 'sans-serif'],
    },
    extend: {
      /* color scale */
      colors: {
        primary: {
          100: '#FFF3DF',
          200: '#FFE8B0',
          300: '#FFDB83',
          400: '#FFD262',
          500: '#FCC659',
        },
        secondary: {
          100: '#FFAC39',
          200: '#FD9F02',
          300: '#FF8204',
        },
        system: {
          red: '#FE5E4B',
          blue: '#55CBEF',
          yellow: '#FFEB00',
          green: '#57E45C',
          kakao: '#FEE500',
        },
        gray: {
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#C9C9CA',
          400: '#ADACAF',
          500: '#858386',
          600: '#676668',
          700: '#4C494E',
          800: '#333036',
        },
        background: '#F9F8F6',
        white: '#FFFFFF',
      },
    },
    /* font scale */
    fontSize: {
      // heading, h 태그에 사용
      heading01: ['1.5rem', { lineHeight: '1.8rem', fontWeight: '700' }],
      heading02: ['1.25rem', { lineHeight: '1.5rem', fontWeight: '700' }],
      heading03: ['1.125rem', { lineHeight: '1.35rem', fontWeight: '700' }],
      heading04: ['1rem', { lineHeight: '1.1875rem', fontWeight: '700' }],
      heading05: ['0.875rem', { lineHeight: '1.05rem', fontWeight: '700' }],
      // body, p 태그에 사용
      body01: ['1rem', { lineHeight: '1.1875rem', fontWeight: '500' }],
      body02: ['0.875rem', { lineHeight: '1.05rem', fontWeight: '500' }],
      body03: ['0.75rem', { lineHeight: '0.9rem', fontWeight: '500' }],
      body04: ['0.6875rem', { lineHeight: '0.825rem', fontWeight: '400' }],
      body05: ['0.625rem', { lineHeight: '0.75rem', fontWeight: '400' }],
      body06: ['0.5rem', { lineHeight: '0.625rem', fontWeight: '400' }],
      // paragraph, pre 태그 & 2줄 이상의 긴 텍스트에 사용
      paragraph: ['0.875rem', { lineHeight: '1.225rem', fontWeight: '400' }],
    },
    /* box shadow */
    boxShadow: {
      avatar: '0px 0px 1px rgba(0,0,0,0.12))',
      card: '0px 0px 4px rgba(0,0,0,0.12))',
      modal: '0px 0px 8px rgba(0,0,0,0.12))',
    },
  },
  plugins: [
    plugin(function ({ addComponents, theme }) {
      addComponents({
        '.shadow-card': {
          boxShadow: theme('boxShadow.card'),
        },
        '.shadow-avatar': {
          boxShadow: theme('boxShadow.avatar'),
        },
        '.shadow-modal': {
          boxShadow: theme('boxShadow.modal'),
        },
      })
    }),
  ],
} satisfies Config
