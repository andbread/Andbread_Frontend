import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // next dev는 경로마다 첫 진입에서 컴파일하므로 기본 시간보다 넉넉히 잡는다.
  timeout: 90_000,
  expect: { timeout: 20_000 },
  forbidOnly: !!process.env.CI,
  // 같은 커밋으로 20회 돌린 결과 케이스 실패율이 0.31%였고, 유일한 실패도
  // Supabase 쪽 시계 오차로 보이는 일회성 오류였다(#215).
  // 1회면 이런 딸꾹질은 흡수하고 반복해서 깨지는 테스트는 그대로 빨갛게 남는다.
  // 재시도로 통과한 건은 flaky로 따로 집계되므로 흔들림 관측도 계속된다.
  retries: process.env.CI ? 1 : 0,
  // next dev 서버가 단일 프로세스라 워커를 늘리면 경로 컴파일이 서로 밀려 타임아웃이 난다.
  // CI는 빌드된 서버를 실행하므로 병렬로 돌려도 안정적이다.
  // ubuntu-latest가 4 vCPU라 브라우저가 CPU를 다 먹지 않도록 2로 둔다.
  workers: process.env.CI ? 2 : 1,
  reporter: [[process.env.CI ? 'line' : 'list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // 서비스가 모바일 우선이라 모바일을 기본 대상으로 둔다.
    // Pixel 5는 Chromium 기반이라 브라우저 바이너리를 하나만 설치해도 된다.
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // CI는 빌드 결과를 실행한다. 경로마다 처음 들어갈 때 컴파일하는
        // dev 서버와 달리 첫 진입이 느리지 않아 결과가 안정적이다.
        command: process.env.CI ? 'npm run start' : 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
