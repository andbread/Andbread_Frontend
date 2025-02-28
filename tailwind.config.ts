import type { Config } from 'tailwindcss'
import pxToRem from 'tailwindcss-preset-px-to-rem'
import plugin from 'tailwindcss/plugin'

export default {
  presets: [pxToRem],
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
      heading01: ['24px', { lineHeight: '28.8px', fontWeight: '700' }],
      heading02: ['20px', { lineHeight: '24px', fontWeight: '700' }],
      heading03: ['18px', { lineHeight: '21.6px', fontWeight: '700' }],
      heading04: ['16px', { lineHeight: '19px', fontWeight: '700' }],
      heading05: ['14px', { lineHeight: '16.8px', fontWeight: '700' }],
      // body, p 태그에 사용
      body01: ['16px', { lineHeight: '19px', fontWeight: '500' }],
      body02: ['14px', { lineHeight: '16.8px', fontWeight: '500' }],
      body03: ['12px', { lineHeight: '14.4px', fontWeight: '500' }],
      body04: ['11px', { lineHeight: '13.2px', fontWeight: '400' }],
      body05: ['10px', { lineHeight: '12px', fontWeight: '400' }],
      body06: ['8px', { lineHeight: '10px', fontWeight: '400' }],
      // paragraph, pre 태그 & 2줄 이상의 긴 텍스트에 사용
      paragraph: ['14px', { lineHeight: '19.6px', fontWeight: '400' }],
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
