import { defineConfig } from 'vitest/config'

export default defineConfig({
  // tsconfig 의 "@/*" 경로 별칭을 Vite 기본 기능으로 해석한다.
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          // e2e 의 *.spec.ts 는 include 에 걸리지 않지만, 테스트 위치가 늘어나도
          // Playwright 스펙을 집어가지 않도록 방어로 남긴다.
          exclude: ['src/**/*.integration.test.ts', 'e2e/**', 'node_modules/**'],
        },
      },
      {
        extends: true,
        test: {
          // 실제 테스트용 Supabase 에 요청한다. 접속 정보가 필요해 CI 의 npm test 에는 넣지 않는다.
          name: 'integration',
          include: ['src/**/*.integration.test.ts'],
          // Route Handler 모듈이 import 시점에 env 를 읽으므로 그보다 먼저 .env 로딩과
          // 운영 DB 가드가 실행되게 한다.
          setupFiles: ['e2e/fixtures/env.ts'],
          // Next.js env 로더는 NODE_ENV=test 이면 .env.local 을 건너뛰고 .env(운영)만 읽는다.
          // E2E 와 같은 .env.local 을 읽도록 development 로 둔다.
          env: { NODE_ENV: 'development' },
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
})
