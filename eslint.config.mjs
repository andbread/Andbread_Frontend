// import { dirname } from 'path'
// import { fileURLToPath } from 'url'
// import { FlatCompat } from '@eslint/eslintrc'

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)

// const compat = new FlatCompat({
//   baseDirectory: __dirname,
// })

// const eslintConfig = [
//   ...compat.extends('next/core-web-vitals', 'next/typescript'),

//   {
//     extends: ['prettier'],
//   },

//   {
//     plugins: ['tailwindcss'],
//   },
// ]

// export default eslintConfig

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import next from 'eslint-plugin-next'
import prettier from 'eslint-config-prettier'
import tailwindcss from 'eslint-plugin-tailwindcss'

export default [
  js.configs.recommended, // 기본 JS 규칙
  tseslint.configs.recommended, // TypeScript 지원
  next.configs.recommended, // Next.js 규칙
  prettier, // Prettier 규칙 적용
  {
    plugins: {
      tailwindcss,
    },
    rules: {
      'tailwindcss/no-custom-classname': 'off', // 필요하면 Tailwind 관련 규칙 추가 가능
    },
  },
]
