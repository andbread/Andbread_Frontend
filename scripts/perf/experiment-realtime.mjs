/**
 * 실험: 개선 전의 Realtime 수신 지연이 "빈 토픽 구독" 때문인지 확인한다.
 *
 * 세 조건을 같은 조건에서 번갈아 측정한다.
 *   A (포트 3000) 개선 전 원본
 *   B (포트 3002) 개선 전 + `if (!nbreadId) return` 가드 한 줄만 추가
 *   C (포트 3001) 개선 후
 *
 * B가 C에 가까우면 빈 토픽 구독이 원인으로 확정된다.
 * B가 A에 가까우면 원인은 다른 곳에 있다.
 *
 * 지연을 두 구간으로 쪼개 잰다. 앱 코드를 건드리지 않고 WebSocket 프레임
 * 도착 시각을 밖에서 관측하므로, 세 조건에 동일하게 적용된다.
 *   insertToFrame : 서버 insert 직전 → 해당 이벤트 프레임이 브라우저에 도착
 *   frameToPaint  : 프레임 도착 → 메시지가 화면에 보임
 *
 * 실행: node scripts/perf/experiment-realtime.mjs <setup.json> --out <디렉터리>
 */

import { chromium } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const EXPECTED_PROJECT_REF = 'yyisakaqnaoomehqlyjz'
const CPU_THROTTLE_RATE = 4
const SETTLE_MS = 5000
const RUNS = 20
const WARMUP = 2
const RECEIVE_TIMEOUT_MS = 30_000
const INPUT_SELECTOR = 'input[placeholder="메세지를 입력하세요"]'

/**
 * scenario=receive : 상대가 보낸 메시지를 받는 경로 (낙관적 업데이트 무관)
 * scenario=send    : 내가 보낸 메시지가 화면에 뜨는 경로 (낙관적 업데이트 포함)
 */
const scenarioIndex = process.argv.indexOf('--scenario')
const scenario = scenarioIndex === -1 ? 'receive' : process.argv[scenarioIndex + 1]

const CONDITIONS = [
  { key: 'A_before', url: 'http://127.0.0.1:3000' },
  { key: 'B_guard', url: 'http://127.0.0.1:3002' },
  { key: 'C_after', url: 'http://127.0.0.1:3001' },
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

if (!setupPath || !outDir) {
  throw new Error(
    '사용법: node scripts/perf/experiment-realtime.mjs <setup.json> --out <디렉터리>',
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

const initScript = ({ storageKey, storageValue, userStore }) => {
  localStorage.setItem(storageKey, storageValue)
  localStorage.setItem('user-store', userStore)
  window.__perfLog = []
}

const summarizePerfLog = (entries) => {
  const commits = entries.filter((entry) => entry.id === 'ChatRoom')
  const durations = commits.map((entry) => entry.actualDuration)
  return {
    commitCount: commits.length,
    actualDurationSum: durations.reduce((sum, value) => sum + value, 0),
  }
}

const clearRunMessages = async () => {
  await admin
    .from('chat_messages')
    .delete()
    .eq('nbread_id', setup.nbreadId)
    .like('content', 'exp-%')
}

const main = async () => {
  mkdirSync(outDir, { recursive: true })

  const viewer = await captureSession(setup.accounts[0])
  const sender = await captureSession(setup.accounts[1])
  const senderAccount = setup.accounts[1]

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

  for (let run = 0; run < RUNS + WARMUP; run += 1) {
    const isWarmup = run < WARMUP

    // 회차마다 조건 순서를 회전시켜 시간 드리프트가 한 조건에만 실리지 않게 한다
    const order = CONDITIONS.slice(run % CONDITIONS.length).concat(
      CONDITIONS.slice(0, run % CONDITIONS.length),
    )

    for (const condition of order) {
      const content = `exp-${condition.key}-${run}-${Date.now()}`
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
      await context.addInitScript(initScript, injection)

      const page = await context.newPage()

      // 앱 코드를 건드리지 않고 이벤트 도착 시각을 밖에서 관측한다
      const frames = []
      let topicNameRequired = 0
      page.on('websocket', (ws) => {
        ws.on('framereceived', (frame) => {
          const payload = String(frame.payload)
          if (payload.includes('TopicNameRequired')) {
            topicNameRequired += 1
          }
          if (payload.includes(content)) {
            frames.push(Date.now())
          }
        })
      })

      const cdp = await context.newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE })

      try {
        await page.goto(`${condition.url}/nbread/${setup.nbreadId}?tab=chat`, {
          waitUntil: 'commit',
        })
        await page.getByText('seed-0100', { exact: false }).first().waitFor({ timeout: 60_000 })
        await page.waitForTimeout(SETTLE_MS)
        await page.evaluate(() => {
          window.__perfLog = []
        })

        let startedAt
        if (scenario === 'send') {
          await page.click(INPUT_SELECTOR)
          await page.fill(INPUT_SELECTOR, content)
          startedAt = Date.now()
          await page.keyboard.press('Enter')
        } else {
          startedAt = Date.now()
          const { error } = await sender.client.from('chat_messages').insert({
            nbread_id: setup.nbreadId,
            user_id: senderAccount.userId,
            user_name: senderAccount.name,
            user_profile_image: null,
            content,
          })

          if (error) {
            throw new Error(`insert 실패: ${error.message}`)
          }
        }

        const insertedAt = startedAt

        await page
          .getByText(content, { exact: false })
          .first()
          .waitFor({ timeout: RECEIVE_TIMEOUT_MS })
        const paintedAt = Date.now()

        const frameAt = frames.length > 0 ? frames[0] : null
        const perfLog = await page.evaluate(() => window.__perfLog ?? [])

        if (!isWarmup) {
          results.push({
            condition: condition.key,
            run: run - WARMUP,
            insertToPaint: paintedAt - insertedAt,
            insertToFrame: frameAt === null ? null : frameAt - insertedAt,
            frameToPaint: frameAt === null ? null : paintedAt - frameAt,
            frameSeen: frameAt !== null,
            topicNameRequired,
            ...summarizePerfLog(perfLog),
          })
        }
      } catch (error) {
        failures.push({ condition: condition.key, run, message: error.message })
      } finally {
        await context.close()
        await clearRunMessages()
      }
    }

    process.stdout.write(`\r${isWarmup ? 'warmup' : 'run'} ${run + 1}/${RUNS + WARMUP}   `)
  }

  await browser.close()

  const outPath = join(outDir, `realtime-experiment-${scenario}.json`)
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        cpuThrottleRate: CPU_THROTTLE_RATE,
        settleMs: SETTLE_MS,
        scenario,
        runs: RUNS,
        warmup: WARMUP,
        conditions: CONDITIONS,
        nbreadId: setup.nbreadId,
        failures,
        results,
      },
      null,
      2,
    ),
  )

  console.log(`\n실험 완료: ${results.length}건 → ${outPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
