/**
 * 항목별 기여도 측정 러너
 *
 * 개선 전 코드에 축을 하나씩만 얹은 8개 조건을 전송 시나리오에서 번갈아 측정한다.
 * 한 번의 실행으로 두 지표를 함께 기록해, 지표에 따라 다른 축을 가려낸다.
 *
 *   keydownToPaint   체감 지연. 네트워크 포함. B(낙관적 업데이트), E(구독 가드), F(스크롤)
 *   actualDurationSum 렌더 비용. 네트워크 무관. A(분리/memo/key), C(시간 포맷)
 *
 * 계측 방식은 본 측정(run-measurement.mjs)의 S2와 같다. 페이지 안에서
 * Enter keydown 시각을 재므로 프로세스 간 지연이 섞이지 않는다.
 *
 * 실행: node scripts/perf/run-contribution.mjs <setup.json> --out <디렉터리> [--pilot]
 */

import { chromium } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { COMPILER_CONDITIONS, CONDITIONS } from './conditions.mjs'

/** --set compiler 를 주면 React Compiler 비교 실험 조건을 쓴다 */
const setIndex = process.argv.indexOf('--set')
const isCompilerSet = setIndex !== -1 && process.argv[setIndex + 1] === 'compiler'
const ACTIVE_CONDITIONS = isCompilerSet ? COMPILER_CONDITIONS : CONDITIONS

const EXPECTED_PROJECT_REF = 'yyisakaqnaoomehqlyjz'
const CPU_THROTTLE_RATE = 4
const SIZE = 100
const SETTLE_MS = 5000
const PAINT_TIMEOUT_MS = 30_000
const MAX_ATTEMPTS = 3
const INPUT_SELECTOR = 'input[placeholder="메세지를 입력하세요"]'

const isPilot = process.argv.includes('--pilot')
const MEASURED_RUNS = isPilot ? 2 : 20
const WARMUP_RUNS = isPilot ? 1 : 2

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
const outIndex = process.argv.indexOf('--out')
const outDir = outIndex === -1 ? null : process.argv[outIndex + 1]

if (!setupPath || !outDir) {
  throw new Error('사용법: node scripts/perf/run-contribution.mjs <setup.json> --out <디렉터리>')
}

const setup = JSON.parse(readFileSync(setupPath, 'utf8'))
const env = parseEnv('.env')

if (!env.NEXT_PUBLIC_SUPABASE_URL.includes(EXPECTED_PROJECT_REF)) {
  throw new Error(`운영 프로젝트가 아닙니다: ${env.NEXT_PUBLIC_SUPABASE_URL}`)
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const captureSession = async (account) => {
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
    throw new Error(`로그인 실패(${account.key}): ${error.message}`)
  }

  const [storageKey] = Object.keys(store)
  return { storageKey, storageValue: store[storageKey] }
}

/** 본 측정과 동일한 주입 스크립트 */
const initScript = ({ storageKey, storageValue, userStore }) => {
  localStorage.setItem(storageKey, storageValue)
  localStorage.setItem('user-store', userStore)

  window.__perfLog = []
  window.__longTasks = []

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__longTasks.push({ startTime: entry.startTime, duration: entry.duration })
      }
    }).observe({ type: 'longtask', buffered: true })
  } catch {
    // longtask 미지원 브라우저는 무시
  }

  window.__watchPaint = (needle, timeoutMs) =>
    new Promise((resolve) => {
      const state = { t0: null }

      const timer = setTimeout(() => {
        observer.disconnect()
        window.removeEventListener('keydown', onKeyDown, true)
        resolve({ t0: state.t0, t1: null, timedOut: true })
      }, timeoutMs)

      const onKeyDown = (event) => {
        if (event.key === 'Enter' && state.t0 === null) {
          state.t0 = performance.now()
        }
      }
      window.addEventListener('keydown', onKeyDown, true)

      const finish = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            clearTimeout(timer)
            observer.disconnect()
            window.removeEventListener('keydown', onKeyDown, true)
            resolve({ t0: state.t0, t1: performance.now(), timedOut: false })
          })
        })
      }

      const observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node.textContent && node.textContent.includes(needle)) {
              finish()
              return
            }
          }
        }
      })

      observer.observe(document.body, { childList: true, subtree: true })
    })
}

const summarizePerfLog = (entries) => {
  const commits = entries.filter((entry) => entry.id === 'ChatRoom')
  const durations = commits.map((entry) => entry.actualDuration)

  return {
    commitCount: commits.length,
    actualDurationSum: durations.reduce((sum, value) => sum + value, 0),
    actualDurationMax: durations.length ? Math.max(...durations) : 0,
  }
}

const clearRunMessages = async () => {
  await admin.from('chat_messages').delete().eq('nbread_id', setup.nbreadId).like('content', 'run-%')
}

const measureOnce = async (browser, condition, injection, runId) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await context.addInitScript(initScript, injection)

  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE })

  try {
    await page.goto(`http://127.0.0.1:${condition.port}/nbread/${setup.nbreadId}?tab=chat`, {
      waitUntil: 'commit',
    })

    // 초기 목록 렌더 완료를 시딩된 마지막 메시지로 확인한다
    await page
      .getByText(`seed-${String(SIZE).padStart(4, '0')}`, { exact: false })
      .first()
      .waitFor({ timeout: 60_000 })

    // 구독이 붙을 때까지의 안정화 대기. 모든 조건에 동일하게 적용된다
    await page.waitForTimeout(SETTLE_MS)
    await page.evaluate(() => {
      window.__perfLog = []
    })

    const content = `run-${runId}`
    const watching = page.evaluate(
      ([needle, timeout]) => window.__watchPaint(needle, timeout),
      [content, PAINT_TIMEOUT_MS],
    )

    await page.click(INPUT_SELECTOR)
    await page.fill(INPUT_SELECTOR, content)
    await page.keyboard.press('Enter')

    const { t0, t1, timedOut } = await watching
    if (timedOut || t0 === null) {
      throw new Error('전송한 메시지가 제한 시간 안에 그려지지 않았습니다')
    }

    const perfLog = await page.evaluate(() => window.__perfLog ?? [])
    const longTasks = await page.evaluate(() => window.__longTasks ?? [])

    return {
      keydownToPaint: t1 - t0,
      longTaskSum: longTasks.reduce((sum, task) => sum + task.duration, 0),
      ...summarizePerfLog(perfLog),
    }
  } finally {
    await context.close()
    await clearRunMessages()
  }
}

const main = async () => {
  mkdirSync(outDir, { recursive: true })

  const viewer = await captureSession(setup.accounts[0])
  const injection = {
    storageKey: viewer.storageKey,
    storageValue: viewer.storageValue,
    userStore: JSON.stringify({
      state: {
        user: {
          id: setup.accounts[0].userId,
          name: setup.accounts[0].name,
          socialType: 'google',
          profileImage: null,
          email: setup.accounts[0].email,
          tag: 1000,
        },
      },
      version: 0,
    }),
  }

  const browser = await chromium.launch()
  const results = []
  const failures = []
  const totalRuns = WARMUP_RUNS + MEASURED_RUNS
  const startedAt = Date.now()

  for (let run = 0; run < totalRuns; run += 1) {
    const isWarmup = run < WARMUP_RUNS

    // 회차마다 조건 순서를 회전시켜 시간 드리프트가 한 조건에만 실리지 않게 한다
    const offset = run % ACTIVE_CONDITIONS.length
    const order = ACTIVE_CONDITIONS.slice(offset).concat(ACTIVE_CONDITIONS.slice(0, offset))

    for (const condition of order) {
      let attempt = 0
      let recorded = false

      while (attempt < MAX_ATTEMPTS && !recorded) {
        attempt += 1
        const runId = `${condition.key}-${run}-${attempt}-${Date.now()}`

        try {
          const measured = await measureOnce(browser, condition, injection, runId)

          if (!isWarmup) {
            results.push({
              condition: condition.key,
              label: condition.label,
              run: run - WARMUP_RUNS,
              attempts: attempt,
              ...measured,
            })
          }
          recorded = true
        } catch (error) {
          failures.push({
            condition: condition.key,
            run,
            attempt,
            message: error.message.split('\n')[0],
          })
        }
      }
    }

    const elapsed = Math.round((Date.now() - startedAt) / 1000)
    process.stdout.write(
      `\r${isWarmup ? '워밍업' : '본측정'} ${run + 1}/${totalRuns}  경과 ${elapsed}초  실패 ${failures.length}건   `,
    )
  }

  await browser.close()

  const outPath = join(outDir, 'contribution-raw.json')
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        scenario: 'send',
        size: SIZE,
        cpuThrottleRate: CPU_THROTTLE_RATE,
        settleMs: SETTLE_MS,
        warmupRuns: WARMUP_RUNS,
        measuredRuns: MEASURED_RUNS,
        conditions: ACTIVE_CONDITIONS.map(({ key, port, label }) => ({ key, port, label })),
        nbreadId: setup.nbreadId,
        failures,
        results,
      },
      null,
      2,
    ),
  )

  console.log(`\n측정 완료: ${results.length}건, 실패 ${failures.length}건 → ${outPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
