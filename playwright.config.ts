import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // next dev는 경로마다 첫 진입에서 컴파일하므로 기본 시간보다 넉넉히 잡는다.
  timeout: 90_000,
  expect: { timeout: 20_000 },
  forbidOnly: !!process.env.CI,
  // #215 실패율 측정 기간에는 재시도를 끈다. 재시도가 성공하면 흔들림이
  // 결과에 드러나지 않아 측정 자체가 불가능하다. 측정 후 최종값을 정한다.
  retries: 0,
  // next dev 서버가 단일 프로세스라 워커를 늘리면 경로 컴파일이 서로 밀려 타임아웃이 난다.
  // CI는 빌드된 서버를 실행하므로 병렬로 돌려도 안정적이다.
  // ubuntu-latest가 4 vCPU라 브라우저가 CPU를 다 먹지 않도록 2로 둔다.
  workers: process.env.CI ? 2 : 1,
  reporter: [
    [process.env.CI ? 'line' : 'list'],
    ['html', { open: 'never' }],
    // #215 케이스별 실패율을 집계하려면 성공한 실행의 결과도 파일로 남아야 한다.
    ['json', { outputFile: 'test-results/results.json' }],
  ],
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
