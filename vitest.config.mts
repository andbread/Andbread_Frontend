import { defineConfig } from 'vitest/config'

export default defineConfig({
  // tsconfig 의 "@/*" 경로 별칭을 Vite 기본 기능으로 해석한다.
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // include 만으로도 e2e 의 *.spec.ts 는 걸리지 않는다.
    // 테스트 위치가 늘어나도 Playwright 스펙을 집어가지 않도록 방어로 남긴다.
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
