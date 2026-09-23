/**
 * 채팅 렌더링 성능 측정 러너.
 *
 * Before(3000) / After(3001) 두 프로덕션 빌드를 번갈아 측정한다.
 * 계측은 PerfProfiler(window.__perfLog) + 페이지 내 User Timing으로만 하고,
 * 로그인은 supabase 세션을 localStorage에 주입해 소셜 로그인 UI를 건너뛴다.
 *
 * 실행:
 *   node scripts/perf/run-measurement.mjs <setup.json> --out <결과 디렉터리> [--pilot]
 *
 * --pilot 을 주면 셀당 3회만 돌려 계측이 정상인지 확인한다.
 */

import { chromium } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const EXPECTED_PROJECT_REF = 'yyisakaqnaoomehqlyjz'
const BEFORE_URL = process.env.PERF_BEFORE_URL ?? 'http://127.0.0.1:3000'
const AFTER_URL = process.env.PERF_AFTER_URL ?? 'http://127.0.0.1:3001'
const CPU_THROTTLE_RATE = 4
const WARMUP_RUNS = 3
const MEASURED_RUNS = 20
const INPUT_SELECTOR = 'input[placeholder="메세지를 입력하세요"]'
/** 초기 렌더 후 realtime 구독이 붙을 때까지의 안정화 대기. 양쪽 조건 동일 */
const SETTLE_MS = 5000
const PAINT_TIMEOUT_MS = 30_000
const MAX_ATTEMPTS = 3

const NETWORKS = {
  N1: null,
  N2: {
    offline: false,
    latency: 400,
    downloadThroughput: -1,
    uploadThroughput: -1,
  },
}

/** 실행 매트릭스: 5.1절 표와 일치해야 한다 */
const CELLS = [
  { scenario: 'S1', size: 100, network: 'N1' },
  { scenario: 'S1', size: 100, network: 'N2' },
  { scenario: 'S1', size: 300, network: 'N1' },
  { scenario: 'S2', size: 100, network: 'N1' },
  { scenario: 'S2', size: 100, network: 'N2' },
  { scenario: 'S2', size: 300, network: 'N1' },
  { scenario: 'S3', size: 100, network: 'N1' },
  { scenario: 'S3', size: 100, network: 'N2' },
  { scenario: 'S4', size: 100, network: 'N1' },
  { scenario: 'S4', size: 300, network: 'N1' },
  { scenario: 'S5', size: 100, network: 'N1' },
  { scenario: 'S5', size: 100, network: 'N2' },
]

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
const isPilot = process.argv.includes('--pilot')
const runsPerCell = isPilot ? 3 : MEASURED_RUNS
const warmupRuns = isPilot ? 1 : WARMUP_RUNS

/** --only S2,S4 처럼 시나리오를 좁혀 계측을 빠르게 점검한다 */
const onlyIndex = process.argv.indexOf('--only')
const onlyScenarios =
  onlyIndex === -1 ? null : process.argv[onlyIndex + 1].split(',').map((value) => value.trim())

if (!setupPath || !outDir) {
  throw new Error(
    '사용법: node scripts/perf/run-measurement.mjs <setup.json> --out <결과 디렉터리> [--pilot]',
  )
}

const setup = JSON.parse(readFileSync(setupPath, 'utf8'))
const env = parseEnv('.env')

if (!env.NEXT_PUBLIC_SUPABASE_URL.includes(EXPECTED_PROJECT_REF)) {
  throw new Error(`운영 프로젝트가 아닙니다: ${env.NEXT_PUBLIC_SUPABASE_URL}`)
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/** 로그인 후 supabase-js가 저장한 localStorage 항목을 그대로 가져온다 */
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
  return { client, storageKey, storageValue: store[storageKey] }
}

const userStoreValue = (account) =>
  JSON.stringify({
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

/** 페이지 로드 전에 주입: 세션, 사용자 정보, longtask 관측, 대기 헬퍼 */
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

  /**
   * needle 텍스트를 가진 노드가 화면에 그려질 때까지 기다린다.
   * Enter keydown 시각(t0)과 페인트 직후 시각(t1)을 함께 돌려준다.
   * 전체 DOM을 훑지 않고 추가된 노드만 검사해 관측 자체의 비용을 줄인다.
   */
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

  window.__markT0 = () => {
    window.__t0 = performance.now()
  }
}

const summarizePerfLog = (entries) => {
  const commits = entries.filter((entry) => entry.id === 'ChatRoom')
  const durations = commits.map((entry) => entry.actualDuration)
  const base = commits.map((entry) => entry.baseDuration)

  return {
    commitCount: commits.length,
    actualDurationSum: durations.reduce((sum, value) => sum + value, 0),
    actualDurationMax: durations.length ? Math.max(...durations) : 0,
    baseDurationSum: base.reduce((sum, value) => sum + value, 0),
    // memo가 하위 트리를 건너뛰면 actual/base 비율이 크게 떨어진다
    actualOverBase:
      base.reduce((sum, value) => sum + value, 0) > 0
        ? durations.reduce((sum, value) => sum + value, 0) /
          base.reduce((sum, value) => sum + value, 0)
        : null,
  }
}

const openPage = async (browser, condition, cell, injection) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await context.addInitScript(initScript, injection)

  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)

  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE })

  const network = NETWORKS[cell.network]
  if (network) {
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', network)
  }

  return { context, page }
}

const chatUrl = (condition) =>
  `${condition === 'before' ? BEFORE_URL : AFTER_URL}/nbread/${setup.nbreadId}?tab=chat`

/** 시딩된 마지막 메시지가 보일 때까지 = 초기 목록 렌더 완료 */
const waitForInitialRender = async (page, size) => {
  const lastSeed = `seed-${String(size).padStart(4, '0')}`
  await page.getByText(lastSeed, { exact: false }).first().waitFor({ timeout: 60_000 })
}

const scenarios = {
  async S1({ page, cell }) {
    const startedAt = Date.now()
    await page.goto(chatUrl(cell.condition), { waitUntil: 'commit' })
    await waitForInitialRender(page, cell.size)
    const wallClock = Date.now() - startedAt

    return { wallClock }
  },

  async S2({ page, cell, runId }) {
    await page.goto(chatUrl(cell.condition), { waitUntil: 'commit' })
    await waitForInitialRender(page, cell.size)
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
    if (timedOut) {
      throw new Error('S2: 전송한 메시지가 제한 시간 안에 그려지지 않았습니다')
    }
    return { keydownToPaint: t0 === null ? null : t1 - t0 }
  },

  async S3({ page, cell, runId, senderClient }) {
    await page.goto(chatUrl(cell.condition), { waitUntil: 'commit' })
    await waitForInitialRender(page, cell.size)
    await page.waitForTimeout(SETTLE_MS)
    await page.evaluate(() => {
      window.__perfLog = []
    })

    const content = `run-${runId}`
    const watching = page.evaluate(
      ([needle, timeout]) => window.__watchPaint(needle, timeout),
      [content, PAINT_TIMEOUT_MS],
    )

    await page.evaluate(() => window.__markT0())

    const sender = setup.accounts[1]
    const { error } = await senderClient.from('chat_messages').insert({
      nbread_id: setup.nbreadId,
      user_id: sender.userId,
      user_name: sender.name,
      user_profile_image: null,
      content,
    })

    if (error) {
      throw new Error(`S3 상대 메시지 전송 실패: ${error.message}`)
    }

    const { t1, timedOut } = await watching
    if (timedOut) {
      throw new Error('S3: 수신 메시지가 제한 시간 안에 그려지지 않았습니다')
    }
    const t0 = await page.evaluate(() => window.__t0)

    // 노드 프로세스에서 insert했으므로 왕복 지연이 섞인 근사값이다
    return { receiveToPaintApprox: t1 - t0 }
  },

  async S4({ page, cell }) {
    await page.goto(chatUrl(cell.condition), { waitUntil: 'commit' })
    await waitForInitialRender(page, cell.size)
    await page.waitForTimeout(SETTLE_MS)
    await page.click(INPUT_SELECTOR)
    await page.evaluate(() => {
      window.__perfLog = []
    })

    await page.keyboard.type('가나다라마바사아자차', { delay: 30 })
    await page.waitForTimeout(300)

    return { typedChars: 10 }
  },

  async S5({ page, cell, runId }) {
    await page.goto(chatUrl(cell.condition), { waitUntil: 'commit' })
    await waitForInitialRender(page, cell.size)
    await page.waitForTimeout(SETTLE_MS)
    await page.evaluate(() => {
      window.__perfLog = []
    })

    const latencies = []
    for (let index = 0; index < 5; index += 1) {
      const content = `run-${runId}-${index}`
      const watching = page.evaluate(
      ([needle, timeout]) => window.__watchPaint(needle, timeout),
      [content, PAINT_TIMEOUT_MS],
    )

      await page.click(INPUT_SELECTOR)
      await page.fill(INPUT_SELECTOR, content)
      await page.keyboard.press('Enter')

      const { t0, t1, timedOut } = await watching
      if (timedOut) {
        throw new Error('S5: 전송한 메시지가 제한 시간 안에 그려지지 않았습니다')
      }
      latencies.push(t0 === null ? null : t1 - t0)
    }

    return { latencies }
  },
}

const clearRunMessages = async () => {
  await admin
    .from('chat_messages')
    .delete()
    .eq('nbread_id', setup.nbreadId)
    .like('content', 'run-%')
}

const seedTo = async (size) => {
  const { execFileSync } = await import('node:child_process')
  execFileSync(
    process.execPath,
    ['scripts/perf/seed-messages.mjs', setupPath, '--count', String(size)],
    { stdio: 'pipe' },
  )
}

const main = async () => {
  mkdirSync(outDir, { recursive: true })

  const viewer = await captureSession(setup.accounts[0])
  const sender = await captureSession(setup.accounts[1])

  const injection = {
    storageKey: viewer.storageKey,
    storageValue: viewer.storageValue,
    userStore: userStoreValue(setup.accounts[0]),
  }

  const browser = await chromium.launch()
  const results = []
  const failures = []
  let currentSize = null

  const activeCells = onlyScenarios
    ? CELLS.filter((cell) => onlyScenarios.includes(cell.scenario))
    : CELLS

  for (const cell of activeCells) {
    if (currentSize !== cell.size) {
      await seedTo(cell.size)
      currentSize = cell.size
    }

    const label = `${cell.scenario}/${cell.size}/${cell.network}`

    for (let run = 0; run < runsPerCell + warmupRuns; run += 1) {
      const isWarmup = run < warmupRuns

      // 조건 교차: 회차마다 순서를 뒤집어 한쪽에만 드리프트가 실리지 않게 한다
      const order = run % 2 === 0 ? ['before', 'after'] : ['after', 'before']

      for (const condition of order) {
        const runId = `${cell.scenario}-${cell.size}-${cell.network}-${run}-${condition}`

        // 초기 렌더 실패(간헐적 PGRST303 401)나 페인트 미도달은 조건과 무관하게
        // 무작위로 발생하므로, 재시도해도 비교가 한쪽으로 치우치지 않는다.
        let attempt = 0
        let lastError = null

        while (attempt < MAX_ATTEMPTS) {
          attempt += 1
          const { context, page } = await openPage(browser, condition, cell, injection)

          try {
            const scenarioResult = await scenarios[cell.scenario]({
              page,
              cell: { ...cell, condition },
              runId,
              senderClient: sender.client,
            })

            const perfLog = await page.evaluate(() => window.__perfLog ?? [])
            const longTasks = await page.evaluate(() => window.__longTasks ?? [])

            if (!isWarmup) {
              results.push({
                scenario: cell.scenario,
                size: cell.size,
                network: cell.network,
                condition,
                run: run - warmupRuns,
                attempts: attempt,
                ...scenarioResult,
                ...summarizePerfLog(perfLog),
                longTaskCount: longTasks.length,
                longTaskTotal: longTasks.reduce((sum, task) => sum + task.duration, 0),
              })
            }

            lastError = null
            break
          } catch (error) {
            lastError = error
            failures.push({ runId, attempt, message: error.message })
          } finally {
            await context.close()
            await clearRunMessages()
          }
        }

        if (lastError) {
          throw new Error(`${runId} ${MAX_ATTEMPTS}회 모두 실패: ${lastError.message}`)
        }
      }

      process.stdout.write(
        `\r${label} ${isWarmup ? 'warmup' : 'run'} ${run + 1}/${runsPerCell + WARMUP_RUNS}   `,
      )
    }

    process.stdout.write('\n')
  }

  await browser.close()

  const outPath = join(outDir, `raw-${isPilot ? 'pilot' : 'main'}.json`)
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        cpuThrottleRate: CPU_THROTTLE_RATE,
        runsPerCell,
        warmupRuns,
        beforeUrl: BEFORE_URL,
        afterUrl: AFTER_URL,
        nbreadId: setup.nbreadId,
        settleMs: SETTLE_MS,
        failures,
        results,
      },
      null,
      2,
    ),
  )

  console.log(`\n측정 완료: ${results.length}건 → ${outPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
