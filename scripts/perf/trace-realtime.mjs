/**
 * 개선 전 코드의 Realtime 지연이 어디서 오는지 WebSocket 타임라인으로 추적한다.
 *
 * 성능 비교가 아니라 사건의 순서를 보는 것이 목적이다. 그래서 조건이 하나뿐이고,
 * 유휴 상태도 필요 없다. 다만 측정 조건을 본 측정과 맞추기 위해 CPU 4배 제한은
 * 그대로 건다.
 *
 * 확인하려는 가설:
 *   빈 토픽 join이 거절되면서 소켓 자체가 끊기고, realtime-js의 계단식 재연결
 *   백오프(RECONNECT_INTERVALS = [1000, 2000, 5000, 10000])를 타느라 약 4초의
 *   고정 지연이 생긴다.
 *
 * 가설이 맞으면 소켓 열림 이벤트가 2회 이상 관측되고, 그 간격이 백오프 계단과
 * 맞아떨어진다. 틀리면 소켓은 하나이고 지연은 다른 곳에 있다.
 *
 * 실행: node scripts/perf/trace-realtime.mjs
 */

import { chromium } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const SCRATCH = process.env.PERF_SCRATCH ?? 'C:/Users/user/AppData/Local/Temp/pf'
const SETUP_JSON = join(SCRATCH, 'trace-setup.json')
const EXPECTED_PROJECT_REF = 'yyisakaqnaoomehqlyjz'
const TEST_EMAIL_PREFIX = 'nbread-perf-test-'

const PORT = 3000
const CONDITION_DIR = join(SCRATCH, 'P0_before')
const CPU_THROTTLE_RATE = 4
const SEED_COUNT = 10
const RUNS = 3
/** 마운트 후 이만큼 지켜본다. 백오프 계단(1s, 2s, 5s)을 덮을 만큼 길게 잡는다 */
const OBSERVE_MS = 20_000
const EVENT_TIMEOUT_MS = 30_000

const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
const outDir = join(ROOT, 'docs/performance/results', stamp)

const log = (message) => console.log(`[${new Date().toLocaleTimeString('ko-KR')}] ${message}`)

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

const env = parseEnv(join(ROOT, '.env'))
if (!env.NEXT_PUBLIC_SUPABASE_URL.includes(EXPECTED_PROJECT_REF)) {
  throw new Error(`운영 프로젝트가 아닙니다: ${env.NEXT_PUBLIC_SUPABASE_URL}`)
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const node = (args) => {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', cwd: ROOT })
  if (result.status !== 0) {
    throw new Error(`실패: node ${args.join(' ')}`)
  }
}

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
  if (error) throw new Error(`로그인 실패: ${error.message}`)

  const [storageKey] = Object.keys(store)
  return { client, storageKey, storageValue: store[storageKey] }
}

/**
 * Phoenix 프레임을 읽기 좋은 형태로 바꾼다.
 * realtime-js는 vsn에 따라 배열([join_ref, ref, topic, event, payload])이나
 * 객체 형태를 쓰므로 둘 다 받는다.
 */
const describeFrame = (raw) => {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { topic: null, event: null, note: String(raw).slice(0, 80) }
  }

  if (Array.isArray(parsed)) {
    const [joinRef, ref, topic, event, payload] = parsed
    return { joinRef, ref, topic, event, payload }
  }
  return {
    joinRef: parsed.join_ref,
    ref: parsed.ref,
    topic: parsed.topic,
    event: parsed.event,
    payload: parsed.payload,
  }
}

const summarizePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return ''
  if (payload.status) {
    const reason = payload.response?.reason ?? payload.response?.message
    return `status=${payload.status}${reason ? ` reason=${reason}` : ''}`
  }
  if (payload.data?.record?.content) return `content=${payload.data.record.content}`
  if (payload.record?.content) return `content=${payload.record.content}`
  return ''
}

const traceOnce = async (browser, injection, sender, senderAccount, setup, runIndex) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await context.addInitScript(injection.script, injection.data)

  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE })

  const t0 = Date.now()
  const at = () => Date.now() - t0
  const events = []
  let socketIndex = 0

  page.on('websocket', (ws) => {
    socketIndex += 1
    const id = socketIndex
    events.push({ at: at(), kind: 'socket:open', socket: id, url: ws.url() })

    ws.on('framesent', (frame) => {
      const f = describeFrame(frame.payload)
      events.push({
        at: at(),
        kind: 'send',
        socket: id,
        topic: f.topic,
        event: f.event,
        detail: summarizePayload(f.payload),
      })
    })
    ws.on('framereceived', (frame) => {
      const f = describeFrame(frame.payload)
      events.push({
        at: at(),
        kind: 'recv',
        socket: id,
        topic: f.topic,
        event: f.event,
        detail: summarizePayload(f.payload),
      })
    })
    ws.on('close', () => events.push({ at: at(), kind: 'socket:close', socket: id }))
    ws.on('socketerror', (error) =>
      events.push({ at: at(), kind: 'socket:error', socket: id, detail: String(error) }),
    )
  })

  const content = `trace-${runIndex}-${Date.now()}`
  let insertedAt = null
  let paintedAt = null

  try {
    await page.goto(`http://127.0.0.1:${PORT}/nbread/${setup.nbreadId}?tab=chat`, {
      waitUntil: 'commit',
    })
    await page
      .getByText(`seed-${String(SEED_COUNT).padStart(4, '0')}`, { exact: false })
      .first()
      .waitFor({ timeout: 60_000 })
    events.push({ at: at(), kind: 'mark', detail: '초기 목록 렌더 완료' })

    // 백오프 계단이 다 돌 때까지 지켜본다
    await page.waitForTimeout(OBSERVE_MS)
    events.push({ at: at(), kind: 'mark', detail: `관찰 ${OBSERVE_MS}ms 경과` })

    insertedAt = at()
    const { error } = await sender.client.from('chat_messages').insert({
      nbread_id: setup.nbreadId,
      user_id: senderAccount.userId,
      user_name: senderAccount.name,
      user_profile_image: null,
      content,
    })
    if (error) throw new Error(`insert 실패: ${error.message}`)
    events.push({ at: insertedAt, kind: 'mark', detail: '서버에 메시지 INSERT' })

    await page.getByText(content, { exact: false }).first().waitFor({ timeout: EVENT_TIMEOUT_MS })
    paintedAt = at()
    events.push({ at: paintedAt, kind: 'mark', detail: '메시지가 화면에 보임' })
  } catch (error) {
    events.push({ at: at(), kind: 'error', detail: error.message.split('\n')[0] })
  } finally {
    await context.close()
    await admin.from('chat_messages').delete().eq('nbread_id', setup.nbreadId).like('content', 'trace-%')
  }

  return { runIndex, insertedAt, paintedAt, events }
}

const printTimeline = (trace) => {
  console.log(`\n=== 회차 ${trace.runIndex + 1} ===`)
  const sockets = new Set()
  for (const e of trace.events) {
    if (e.kind === 'socket:open') sockets.add(e.socket)
  }
  console.log(`소켓 열림 ${sockets.size}회`)

  for (const e of trace.events) {
    const time = `${String(e.at).padStart(6)}ms`
    if (e.kind === 'mark') {
      console.log(`${time}  ── ${e.detail}`)
    } else if (e.kind.startsWith('socket')) {
      console.log(`${time}  [소켓${e.socket}] ${e.kind}${e.detail ? ` ${e.detail}` : ''}`)
    } else {
      // 하트비트는 양이 많아 접는다
      if (e.topic === 'phoenix') continue
      const arrow = e.kind === 'send' ? '→' : '←'
      console.log(
        `${time}  [소켓${e.socket}] ${arrow} topic=${JSON.stringify(e.topic)} event=${e.event}${e.detail ? ` ${e.detail}` : ''}`,
      )
    }
  }

  if (trace.insertedAt !== null && trace.paintedAt !== null) {
    console.log(`\nINSERT → 화면 표시: ${trace.paintedAt - trace.insertedAt}ms`)
  }
}

const servers = []

const main = async () => {
  mkdirSync(outDir, { recursive: true })

  if (!existsSync(join(CONDITION_DIR, '.next', 'BUILD_ID'))) {
    throw new Error(`개선 전 빌드가 없습니다: ${CONDITION_DIR}`)
  }

  log(`개선 전 서버 기동 (:${PORT})`)
  servers.push(
    spawn(process.execPath, ['./node_modules/next/dist/bin/next', 'start'], {
      cwd: CONDITION_DIR,
      env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
      stdio: 'ignore',
    }),
  )

  const deadline = Date.now() + 120_000
  let ready = false
  while (!ready && Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/login`)
      ready = response.status < 500
    } catch {
      // 기동 중
    }
    if (!ready) await new Promise((r) => setTimeout(r, 1000))
  }
  if (!ready) throw new Error('서버가 응답하지 않습니다')

  log('운영 테스트 계정 생성')
  if (existsSync(SETUP_JSON)) rmSync(SETUP_JSON)
  node(['scripts/perf/setup-test-accounts.mjs', '--out', SETUP_JSON])

  log(`메시지 ${SEED_COUNT}건 시딩`)
  node(['scripts/perf/seed-messages.mjs', SETUP_JSON, '--count', String(SEED_COUNT)])

  const setup = JSON.parse(readFileSync(SETUP_JSON, 'utf8'))
  const viewer = await captureSession(setup.accounts[0])
  const sender = await captureSession(setup.accounts[1])

  const injection = {
    script: ({ storageKey, storageValue, userStore }) => {
      localStorage.setItem(storageKey, storageValue)
      localStorage.setItem('user-store', userStore)
      window.__perfLog = []
    },
    data: {
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
    },
  }

  const browser = await chromium.launch()
  const traces = []

  for (let run = 0; run < RUNS; run += 1) {
    log(`추적 ${run + 1}/${RUNS}`)
    traces.push(await traceOnce(browser, injection, sender, setup.accounts[1], setup, run))
  }

  await browser.close()

  const outPath = join(outDir, 'realtime-trace.json')
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        tracedAt: new Date().toISOString(),
        condition: 'P0_before',
        cpuThrottleRate: CPU_THROTTLE_RATE,
        seedCount: SEED_COUNT,
        observeMs: OBSERVE_MS,
        traces,
      },
      null,
      2,
    ),
  )

  for (const trace of traces) printTimeline(trace)
  console.log(`\n저장: ${outPath}`)
}

const cleanup = async () => {
  try {
    if (existsSync(SETUP_JSON)) {
      log('운영 테스트 데이터 정리')
      node(['scripts/perf/cleanup-test-accounts.mjs', SETUP_JSON])
    }

    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    for (const user of (data?.users ?? []).filter((u) => (u.email ?? '').startsWith(TEST_EMAIL_PREFIX))) {
      await admin.auth.admin.deleteUser(user.id)
      console.log(`  고아 계정 삭제 ${user.email}`)
    }
    const { data: nbreads } = await admin.from('nbread').select('id, title')
    for (const row of (nbreads ?? []).filter((r) => (r.title ?? '').startsWith('[PERF]'))) {
      await admin.from('chat_messages').delete().eq('nbread_id', row.id)
      await admin.from('participant').delete().eq('nbread_id', row.id)
      await admin.from('nbread').delete().eq('id', row.id)
      console.log(`  고아 엔빵 삭제 ${row.id}`)
    }
  } catch (error) {
    console.error(`정리 중 오류: ${error.message}`)
  } finally {
    for (const child of servers) {
      try {
        child.kill()
      } catch {
        // 이미 종료됨
      }
    }
    log('서버 종료')
  }
}

main()
  .then(cleanup)
  .catch(async (error) => {
    console.error(`\n실패: ${error.message}`)
    await cleanup()
    process.exit(1)
  })
