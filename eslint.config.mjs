import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import prettier from 'eslint-config-prettier'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  prettier,
  {
    // Playwright 테스트는 await가 빠져도 조용히 통과하므로 타입 정보를 켜고 잡는다.
    files: ['e2e/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      // Playwright fixture의 인자 이름이 use라서 React Hook으로 오인된다.
      'react-hooks/rules-of-hooks': 'off',
    },
  },
]

export default eslintConfig
