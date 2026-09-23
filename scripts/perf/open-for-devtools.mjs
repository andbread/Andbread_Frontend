/**
 * React DevTools Profiler 수동 캡처용 브라우저를 띄운다.
 *
 * 실제 Chrome을 전용 프로필로 실행하고, 설치돼 있는 React Developer Tools
 * 확장을 로드한 뒤, 로그인 세션을 주입해 채팅 탭까지 진입시킨다.
 * 자동 측정과 조건을 맞추려고 CPU 스로틀링도 동일하게 4배로 건다.
 *
 * 브라우저를 열어 둔 채 대기하므로, DevTools 조작과 화면 캡처는
 * 이 프로세스 밖에서 수행한다. 종료하려면 프로세스를 kill 한다.
 *
 * 실행: node scripts/perf/open-for-devtools.mjs <setup.json> --port 3000
 */

import { chromium } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// 사용자 Chrome의 확장을 복사해 둔 프로필. 언팩 로드로는 React DevTools가
// 페이지에 훅을 주입하지 못해, 정식 설치본이 담긴 복사 프로필을 쓴다.
const USER_DATA_DIR =
  'C:/Users/user/AppData/Local/Temp/claude/C--Users-user-orca-workspaces-Andbread-Frontend------------/851049cf-30c7-4e0c-8bd9-617927e7cc50/scratchpad/chrome-copy'
const CPU_THROTTLE_RATE = 4

const parseEnv = (path) =>
  Object.fromEntries(
    readFileSync(path, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=')
        return [
          line.slice(0, index).trim(),
          line
            .slice(index + 1)
            .trim()
            .replace(/^['"]|['"]$/g, ''),
        ]
      }),
  )

const setupPath = process.argv[2]
const portIndex = process.argv.indexOf('--port')
const port = portIndex === -1 ? 3000 : Number(process.argv[portIndex + 1])

const setup = JSON.parse(readFileSync(setupPath, 'utf8'))
const env = parseEnv('.env')
const account = setup.accounts[0]

const store = {}
const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: {
      getItem: (key) => store[key] ?? null,
      setItem: (key, value) => {
        store[key] = value
      },
      removeItem: (key) => {
        delete store[key]
      },
    },
  },
})

const { error } = await client.auth.signInWithPassword({
  email: account.email,
  password: account.password,
})

if (error) {
  throw new Error(`로그인 실패: ${error.message}`)
}

const storageKey = Object.keys(store)[0]
const userStore = JSON.stringify({
  state: {
    user: {
      id: account.userId,
      name: account.name,
      socialType: 'google',
      profileImage: null,
      email: account.email,
      tag: 1000,
    },
  },
  version: 0,
})

const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
  channel: 'chrome',
  headless: false,
  viewport: null,
  // Playwright 기본 인자에 --disable-extensions가 들어가면 확장이 전부 꺼진다
  ignoreDefaultArgs: ['--disable-extensions'],
  args: [
    '--window-size=1440,900',
    // DevTools를 자동으로 열어 둔다. 창 포커스를 뺏지 않고도 패널을 쓸 수 있다.
    '--auto-open-devtools-for-tabs',
  ],
})

await context.addInitScript(
  ({ key, value, us }) => {
    localStorage.setItem(key, value)
    localStorage.setItem('user-store', us)
  },
  { key: storageKey, value: store[storageKey], us: userStore },
)

const page = context.pages()[0] ?? (await context.newPage())
const cdp = await context.newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE })

const url = `http://127.0.0.1:${port}/nbread/${setup.nbreadId}?tab=chat`

// 확장 서비스 워커가 깨어나기 전에 첫 페이지가 뜨면 훅이 주입되지 않는다.
// 한 번 더 이동해 React DevTools가 붙은 상태로 만든다.
await page.goto(`http://127.0.0.1:${port}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)

await page.goto(url, { waitUntil: 'commit' })
await page.getByText('seed-0100', { exact: false }).first().waitFor({ timeout: 60_000 })

let hookPresent = await page.evaluate(() => !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__)

// 확장이 콘텐츠 스크립트를 등록하기 전에 진입하면 훅이 없다. 새로고침으로 붙인다.
for (let attempt = 0; attempt < 3 && !hookPresent; attempt += 1) {
  await page.reload({ waitUntil: 'commit' })
  await page.getByText('seed-0100', { exact: false }).first().waitFor({ timeout: 60_000 })
  await page.waitForTimeout(1500)
  hookPresent = await page.evaluate(() => !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
}

console.log(`React DevTools 훅: ${hookPresent ? '붙음' : '없음'}`)

const INPUT_SELECTOR = 'input[placeholder="메세지를 입력하세요"]'
const TRIGGER_FILE = process.env.PERF_TRIGGER_FILE ?? 'perf-trigger.txt'

console.log(`준비 완료: ${url} (포트 ${port}, CPU ${CPU_THROTTLE_RATE}배 제한)`)
console.log(`트리거 파일: ${TRIGGER_FILE} ("s2" 또는 "s4" 를 적으면 해당 동작을 수행)`)

/**
 * 창 포커스를 가져오지 않고도 페이지 동작을 일으키기 위해 트리거 파일을 감시한다.
 * DevTools Profiler 녹화를 시작한 뒤 이 파일을 만들면 동작이 실행된다.
 */
const performAction = async (kind) => {
  if (kind === 'front') {
    // Windows 포그라운드 잠금 때문에 외부에서 창을 띄우지 못할 때 사용한다
    await page.bringToFront()
    console.log('창을 앞으로 가져왔습니다')
    return
  }

  if (kind === 's2') {
    const content = `capture-${Date.now()}`
    await page.click(INPUT_SELECTOR)
    await page.fill(INPUT_SELECTOR, content)
    await page.keyboard.press('Enter')
    console.log(`s2 실행: ${content} 전송`)
    return
  }

  if (kind === 's4') {
    await page.click(INPUT_SELECTOR)
    await page.fill(INPUT_SELECTOR, '')
    await page.keyboard.type('가나다라마바사아자차', { delay: 30 })
    console.log('s4 실행: 10자 타이핑')
    return
  }

  console.log(`알 수 없는 트리거: ${kind}`)
}

const { existsSync, readFileSync: read, unlinkSync } = await import('node:fs')

for (;;) {
  if (existsSync(TRIGGER_FILE)) {
    const kind = read(TRIGGER_FILE, 'utf8').trim()
    unlinkSync(TRIGGER_FILE)
    await performAction(kind).catch((error) => console.log('동작 실패:', error.message))
  }
  await new Promise((resolve) => setTimeout(resolve, 300))
}
