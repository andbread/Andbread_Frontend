/**
 * 사용자가 직접 띄운 Chrome에 CDP로 붙어서 캡처 준비를 한다.
 *
 * React Developer Tools는 웹 스토어에서 설치한 확장이므로, 자동화가 새로
 * 띄운 브라우저에는 붙지 않는다. 그래서 확장이 이미 설치된 사용자 브라우저에
 * 원격 디버깅으로 접속해 세션 주입과 CPU 스로틀링만 대신 처리한다.
 *
 * 사전 준비 (사용자가 실행):
 *   Chrome을 완전히 종료한 뒤
 *   & "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
 *
 * 실행:
 *   node scripts/perf/attach-to-chrome.mjs <setup.json> --port 3000
 *
 * 준비가 끝나면 트리거 파일로 페이지 동작을 일으킨다.
 *   echo s2 > perf-trigger.txt   # 메시지 1건 전송
 *   echo s4 > perf-trigger.txt   # 10자 타이핑
 */

import { chromium } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync, unlinkSync } from 'node:fs'

const CDP_ENDPOINT = process.env.PERF_CDP_ENDPOINT ?? 'http://127.0.0.1:9222'
const CPU_THROTTLE_RATE = 4
const INPUT_SELECTOR = 'input[placeholder="메세지를 입력하세요"]'
const TRIGGER_FILE = process.env.PERF_TRIGGER_FILE ?? 'perf-trigger.txt'

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

if (!setupPath) {
  throw new Error('사용법: node scripts/perf/attach-to-chrome.mjs <setup.json> --port 3000')
}

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
const sessionValue = store[storageKey]
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

const browser = await chromium.connectOverCDP(CDP_ENDPOINT)
const context = browser.contexts()[0]

if (!context) {
  throw new Error('브라우저 컨텍스트를 찾지 못했습니다')
}

const origin = `http://127.0.0.1:${port}`
const page = await context.newPage()

// localStorage는 출처별로 격리되므로, 값을 넣기 전에 해당 출처를 먼저 연다
await page.goto(`${origin}/login`, { waitUntil: 'domcontentloaded' })
await page.evaluate(
  ({ key, value, us }) => {
    localStorage.setItem(key, value)
    localStorage.setItem('user-store', us)
  },
  { key: storageKey, value: sessionValue, us: userStore },
)

const cdp = await context.newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE })

const url = `${origin}/nbread/${setup.nbreadId}?tab=chat`
await page.goto(url, { waitUntil: 'commit' })
await page.getByText('seed-0100', { exact: false }).first().waitFor({ timeout: 60_000 })
await page.bringToFront()

console.log(`준비 완료: ${url}`)
console.log(`CPU ${CPU_THROTTLE_RATE}배 제한 적용, 메시지 100건 렌더 확인`)
console.log(`트리거 파일: ${TRIGGER_FILE} ("s2" 전송 / "s4" 타이핑)`)

const performAction = async (kind) => {
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

for (;;) {
  if (existsSync(TRIGGER_FILE)) {
    const kind = readFileSync(TRIGGER_FILE, 'utf8').trim()
    unlinkSync(TRIGGER_FILE)
    await performAction(kind).catch((actionError) =>
      console.log('동작 실패:', actionError.message),
    )
  }
  await new Promise((resolve) => setTimeout(resolve, 300))
}
