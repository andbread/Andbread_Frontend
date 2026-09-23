/**
 * 실험 2. 같은 웹소켓과 별도 웹소켓
 * (docs/performance/realtime-delay-root-cause-experiment-plan.md)
 *
 * 운영 테스트 계정·엔빵을 한 번 만들고 아래 세 부분을 이어서 실행한 뒤 정리한다.
 *
 * (a) raw   : 독립 웹소켓 클라이언트로 조건 A/B/C를 비교한다.
 *             정상 채널 phx_reply ok + system ok 확인 → 빈 토픽 접속 시작 →
 *             대기 구간 초반·중반·후반(OFFSETS_MS)에 고유 메시지 삽입 →
 *             postgres_changes 프레임 도착과 빈 토픽 오류 응답을 기록한다.
 *               A: 정상·빈 채널 모두 소켓1
 *               B: 정상 소켓1, 빈 채널 소켓2
 *               C: 정상 소켓1, 빈 채널 없음
 * (b) order : 새 소켓에서 접속 요청 순서에 따른 정상 토픽 접속 완료 응답 시각.
 *             empty_then_normal / normal_then_empty / normal_only. 메시지는 쓰지 않는다.
 * (c) app   : 개선 전 빌드(P0_before)로 조건 A만 화면 표시까지 잰다. 앱을 고치지 않으면
 *             B·C를 만들 수 없으므로 A만 한다. realtime-js 재시도가 보낸 빈 토픽 접속을
 *             기준으로 삽입 시점을 잡는다. Playwright 콜백(Node performance.now)과
 *             CDP timestamp를 같은 프레임에 함께 기록한다(실험 3 교차 검증용).
 *
 * 시각: Node 쪽은 모두 performance.now(). CDP timestamp는 브라우저 시계라 CDP끼리만 뺀다.
 * 삽입 시각은 요청 시작·응답 완료 구간으로만 기록한다.
 *
 * 실행: node scripts/perf/trace-realtime-socket-isolation.mjs [--reps 10] [--parts raw,order,app]
 */

import { chromium } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import {
  EMPTY_TOPIC,
  PhoenixSocket,
  ROOT,
  chatChanges,
  describeFrame,
  joinPayload,
  loadEnv,
  log,
  now,
  realtimeUrl,
  redactUrl,
  round,
  saveJson,
  sleep,
  stats,
  summarizePayload,
} from './realtime-rootcause-lib.mjs'

const arg = (name, fallback) => {
  const index = process.argv.indexOf(name)
  return index !== -1 ? process.argv[index + 1] : fallback
}
const REPS = Number(arg('--reps', '10'))
const PARTS = arg('--parts', 'raw,order,app').split(',')

const SCRATCH = process.env.PERF_SCRATCH ?? 'C:/Users/user/AppData/Local/Temp/pf'
const SETUP_JSON = join(SCRATCH, 'rootcause-setup.json')
const CONDITION_DIR = join(SCRATCH, 'P0_before')
const PORT = 3000
const TEST_EMAIL_PREFIX = 'nbread-perf-test-'
const CONTENT_PREFIX = 'rc2-'

const CONDITIONS = ['A', 'B', 'C']
const OFFSETS_MS = [500, 2000, 3500] // 빈 토픽 대기 구간(약 4.1초)의 초반·중반·후반
const ORDERS = ['empty_then_normal', 'normal_then_empty', 'normal_only']
const JOIN_TIMEOUT_MS = 15_000
const FRAME_TIMEOUT_MS = 15_000
const SETTLE_MS = 500
const GAP_MS = 500
const CPU_THROTTLE_RATE = 4

const env = loadEnv()
const url = realtimeUrl(env)
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const rotate = (list, n) => list.map((_, i) => list[(i + n) % list.length])

/** quiet: 표준 출력을 버린다. setup 스크립트는 계정 비밀번호를 출력하므로 콘솔에 남기지 않는다 */
const node = (args, { quiet = false } = {}) => {
  const result = spawnSync(process.execPath, args, {
    stdio: ['ignore', quiet ? 'ignore' : 'inherit', 'inherit'],
    cwd: ROOT,
  })
  if (result.status !== 0) throw new Error(`실패: node ${args[0]}`)
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
  const { data, error } = await client.auth.signInWithPassword({ email: account.email, password: account.password })
  if (error) throw new Error(`로그인 실패: ${error.message}`)
  const [storageKey] = Object.keys(store)
  return { client, accessToken: data.session.access_token, storageKey, storageValue: store[storageKey] }
}

const insertMessage = async (sender, account, nbreadId, content) => {
  const start = now()
  const { error } = await sender.client.from('chat_messages').insert({
    nbread_id: nbreadId,
    user_id: account.userId,
    user_name: account.name,
    user_profile_image: null,
    content,
  })
  const end = now()
  return { start, end, error: error?.message ?? null }
}

const deleteRunMessages = (nbreadId) =>
  admin.from('chat_messages').delete().eq('nbread_id', nbreadId).like('content', `${CONTENT_PREFIX}%`)

const relativeEvents = (events, base) => events.map((e) => ({ ...e, t: round(e.t - base) }))

// ─────────────────────────────── (a) raw ───────────────────────────────

const rawRun = async (ctx, { condition, offsetMs, rep }) => {
  const { viewer, sender, senderAccount, nbreadId } = ctx
  const normalTopic = `realtime:${nbreadId}`
  const events = []
  const s1 = new PhoenixSocket({ id: 1, url, events })
  const s2 = condition === 'B' ? new PhoenixSocket({ id: 2, url, events }) : null
  const out = { part: 'raw', condition, offsetMs, rep, status: 'ok' }
  const content = `${CONTENT_PREFIX}${condition}-${offsetMs}-${rep}-${Date.now()}`

  try {
    await s1.open()
    if (s2) await s2.open()

    const normalJoin = s1.join(normalTopic, joinPayload({ postgresChanges: chatChanges(nbreadId), accessToken: viewer.accessToken }))
    const normalReply = await s1.waitReply(normalJoin, JOIN_TIMEOUT_MS)
    const system = await s1.waitFor(
      (e) => e.dir === 'recv' && e.event === 'system' && e.topic === normalTopic,
      JOIN_TIMEOUT_MS,
      { since: normalJoin.t },
    )
    out.normalJoinReplyMs = normalReply ? round(normalReply.t - normalJoin.t) : null
    out.normalSystemMs = system ? round(system.t - normalJoin.t) : null
    if (normalReply?.status !== 'ok' || system?.status !== 'ok') {
      throw new Error(`정상 채널 준비 실패 reply=${normalReply?.status} system=${system?.status}`)
    }
    await sleep(SETTLE_MS)

    const emptySocket = condition === 'A' ? s1 : s2
    const tEmpty = now()
    const emptyJoin = emptySocket
      ? emptySocket.join(EMPTY_TOPIC, joinPayload({ postgresChanges: chatChanges(''), accessToken: viewer.accessToken }))
      : null

    await sleep(Math.max(0, tEmpty + offsetMs - now()))
    const insert = await insertMessage(sender, senderAccount, nbreadId, content)
    if (insert.error) throw new Error(`insert 실패: ${insert.error}`)

    const change = await s1.waitFor(
      (e) => e.dir === 'recv' && e.event === 'postgres_changes' && e.content === content,
      FRAME_TIMEOUT_MS,
    )
    const emptyReply = emptyJoin ? await emptySocket.waitReply(emptyJoin, JOIN_TIMEOUT_MS) : null

    const rel = (t) => (t === null || t === undefined ? null : round(t - tEmpty))
    Object.assign(out, {
      emptyJoinSocket: emptySocket?.id ?? null,
      emptyReplyMs: emptyJoin && emptyReply ? round(emptyReply.t - emptyJoin.t) : null,
      emptyReplyStatus: emptyReply?.status ?? null,
      emptyReplyReason: emptyReply?.reason ?? null,
      insertStartRel: rel(insert.start),
      insertEndRel: rel(insert.end),
      insertRequestMs: round(insert.end - insert.start),
      changeFrameRel: rel(change?.t),
      changeAfterInsertStartMs: change ? round(change.t - insert.start) : null,
      changeAfterInsertEndMs: change ? round(change.t - insert.end) : null,
      emptyReplyRel: rel(emptyReply?.t),
      changeMinusEmptyReplyMs: change && emptyReply ? round(change.t - emptyReply.t) : null,
      // 삽입 요청 시작 시점에 빈 토픽 요청이 아직 응답을 받지 못한 상태였는가
      emptyPendingAtInsertStart: emptyJoin ? (emptyReply ? emptyReply.t > insert.start : true) : null,
      emptyPendingAtInsertEnd: emptyJoin ? (emptyReply ? emptyReply.t > insert.end : true) : null,
      socketCount: new Set(events.filter((e) => e.kind === 'socket:open').map((e) => e.socket)).size,
    })
    if (!change) out.status = 'change_timeout'
    else if (emptyJoin && !emptyReply) out.status = 'empty_reply_timeout'
    out.eventsBase = 'events.t는 빈 토픽 접속 시작(C는 같은 시점의 가상 기준) 기준 ms'
    out.events = relativeEvents(events, tEmpty)
  } catch (error) {
    out.status = 'error'
    out.error = error.message
    out.events = relativeEvents(events, events[0]?.t ?? 0)
  } finally {
    await s1.close()
    if (s2) await s2.close()
    await deleteRunMessages(nbreadId)
  }
  return out
}

// ─────────────────────────────── (b) order ───────────────────────────────

const orderRun = async (ctx, { order, rep }) => {
  const { viewer, nbreadId } = ctx
  const normalTopic = `realtime:${nbreadId}`
  const events = []
  const s1 = new PhoenixSocket({ id: 1, url, events })
  const out = { part: 'order', order, rep, status: 'ok' }
  try {
    await s1.open()
    const base = now()
    const sendNormal = () =>
      s1.join(normalTopic, joinPayload({ postgresChanges: chatChanges(nbreadId), accessToken: viewer.accessToken }))
    const sendEmpty = () =>
      s1.join(EMPTY_TOPIC, joinPayload({ postgresChanges: chatChanges(''), accessToken: viewer.accessToken }))

    let normalJoin
    let emptyJoin = null
    if (order === 'empty_then_normal') {
      emptyJoin = sendEmpty()
      normalJoin = sendNormal()
    } else if (order === 'normal_then_empty') {
      normalJoin = sendNormal()
      emptyJoin = sendEmpty()
    } else {
      normalJoin = sendNormal()
    }

    const [normalReply, emptyReply, system] = await Promise.all([
      s1.waitReply(normalJoin, JOIN_TIMEOUT_MS),
      emptyJoin ? s1.waitReply(emptyJoin, JOIN_TIMEOUT_MS) : Promise.resolve(null),
      s1.waitFor((e) => e.dir === 'recv' && e.event === 'system' && e.topic === normalTopic, JOIN_TIMEOUT_MS, { since: normalJoin.t }),
    ])

    Object.assign(out, {
      normalRef: normalJoin.ref,
      emptyRef: emptyJoin?.ref ?? null,
      normalReplyMs: normalReply ? round(normalReply.t - normalJoin.t) : null,
      normalReplyStatus: normalReply?.status ?? null,
      emptyReplyMs: emptyReply ? round(emptyReply.t - emptyJoin.t) : null,
      emptyReplyStatus: emptyReply?.status ?? null,
      systemMs: system ? round(system.t - normalJoin.t) : null,
      systemStatus: system?.status ?? null,
      normalMinusEmptyReplyMs: normalReply && emptyReply ? round(normalReply.t - emptyReply.t) : null,
      // 응답 도착 순서 (ref 기준)
      replyOrder: events
        .filter((e) => e.dir === 'recv' && (e.event === 'phx_reply' || e.event === 'system') && e.topic !== 'phoenix')
        .map((e) => `${e.event}:${e.topic === EMPTY_TOPIC ? 'empty' : 'normal'}:ref=${e.ref ?? '-'}:${e.status}`),
    })
    if (!normalReply || (emptyJoin && !emptyReply)) out.status = 'reply_timeout'
    out.events = relativeEvents(events, base)
  } catch (error) {
    out.status = 'error'
    out.error = error.message
    out.events = relativeEvents(events, events[0]?.t ?? 0)
  } finally {
    await s1.close()
  }
  return out
}

// ─────────────────────────────── (c) app ───────────────────────────────

const servers = []

const startServer = async () => {
  if (!existsSync(join(CONDITION_DIR, '.next', 'BUILD_ID'))) throw new Error(`개선 전 빌드가 없습니다: ${CONDITION_DIR}`)
  let occupied = false
  try {
    await fetch(`http://127.0.0.1:${PORT}/login`)
    occupied = true
  } catch {
    // 비어 있음
  }
  if (occupied) throw new Error(`:${PORT}에 이미 다른 서버가 떠 있습니다`)

  servers.push(
    spawn(process.execPath, ['./node_modules/next/dist/bin/next', 'start'], {
      cwd: CONDITION_DIR,
      env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
      stdio: 'ignore',
    }),
  )
  const deadline = Date.now() + 120_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/login`)
      if (response.status < 500) return
    } catch {
      // 기동 중
    }
    await sleep(1000)
  }
  throw new Error('서버가 응답하지 않습니다')
}

const appRun = async (ctx, browser, injection, { offsetMs, rep }) => {
  const { sender, senderAccount, nbreadId } = ctx
  const normalTopic = `realtime:${nbreadId}`
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await context.addInitScript(injection.script, injection.data)
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE })
  await cdp.send('Network.enable')

  const pw = [] // { t: Node performance.now, ... }
  const proto = [] // { ts: CDP ms, ... }
  const waiters = []
  const push = (entry) => {
    pw.push(entry)
    for (const w of [...waiters]) {
      if (w.predicate(entry)) {
        waiters.splice(waiters.indexOf(w), 1)
        clearTimeout(w.timer)
        w.resolve(entry)
      }
    }
  }
  const waitPw = (predicate, timeoutMs) => {
    const existing = pw.find(predicate)
    if (existing) return Promise.resolve(existing)
    return new Promise((resolve) => {
      const w = {
        predicate,
        resolve,
        timer: setTimeout(() => {
          waiters.splice(waiters.indexOf(w), 1)
          resolve(null)
        }, timeoutMs),
      }
      waiters.push(w)
    })
  }

  let pwSocket = 0
  page.on('websocket', (ws) => {
    pwSocket += 1
    const socket = pwSocket
    push({ t: now(), kind: 'socket:open', socket, url: redactUrl(ws.url()) })
    ws.on('framesent', (frame) => {
      const f = describeFrame(frame.payload)
      push({ t: now(), dir: 'send', socket, topic: f.topic, event: f.event, ref: f.ref, joinRef: f.joinRef })
    })
    ws.on('framereceived', (frame) => {
      const f = describeFrame(frame.payload)
      push({ t: now(), dir: 'recv', socket, topic: f.topic, event: f.event, ref: f.ref, joinRef: f.joinRef, ...summarizePayload(f.payload) })
    })
    ws.on('close', () => push({ t: now(), kind: 'socket:close', socket }))
  })
  cdp.on('Network.webSocketCreated', (e) => proto.push({ kind: 'socket:created', requestId: e.requestId, url: redactUrl(e.url) }))
  cdp.on('Network.webSocketFrameSent', (e) => {
    const f = describeFrame(e.response.payloadData)
    proto.push({ ts: e.timestamp * 1000, dir: 'send', requestId: e.requestId, topic: f.topic, event: f.event, ref: f.ref })
  })
  cdp.on('Network.webSocketFrameReceived', (e) => {
    const f = describeFrame(e.response.payloadData)
    proto.push({ ts: e.timestamp * 1000, dir: 'recv', requestId: e.requestId, topic: f.topic, event: f.event, ref: f.ref, ...summarizePayload(f.payload) })
  })
  cdp.on('Network.webSocketClosed', (e) => proto.push({ ts: e.timestamp * 1000, kind: 'socket:close', requestId: e.requestId }))

  const out = { part: 'app', condition: 'A', offsetMs, rep, status: 'ok', cpuThrottleRate: CPU_THROTTLE_RATE }
  const content = `${CONTENT_PREFIX}app-${offsetMs}-${rep}-${Date.now()}`
  const base = now()

  try {
    await page.goto(`http://127.0.0.1:${PORT}/nbread/${nbreadId}?tab=chat`, { waitUntil: 'commit' })
    const system = await waitPw((e) => e.dir === 'recv' && e.event === 'system' && e.topic === normalTopic, 30_000)
    if (system?.status !== 'ok') throw new Error(`정상 채널 system ok 미수신 (${system?.status})`)

    // system ok 이후 realtime-js 재시도가 보낸 첫 빈 토픽 접속을 기준으로 삼는다
    const emptyJoin = await waitPw(
      (e) => e.dir === 'send' && e.topic === EMPTY_TOPIC && e.event === 'phx_join' && e.t > system.t,
      30_000,
    )
    if (!emptyJoin) throw new Error('system ok 이후 빈 토픽 재시도가 오지 않음')

    await sleep(Math.max(0, emptyJoin.t + offsetMs - now()))
    const insert = await insertMessage(sender, senderAccount, nbreadId, content)
    if (insert.error) throw new Error(`insert 실패: ${insert.error}`)

    const [painted, change, emptyReply] = await Promise.all([
      page
        .getByText(content, { exact: false })
        .first()
        .waitFor({ timeout: FRAME_TIMEOUT_MS })
        .then(() => now())
        .catch(() => null),
      waitPw((e) => e.dir === 'recv' && e.event === 'postgres_changes' && e.content === content, FRAME_TIMEOUT_MS),
      waitPw((e) => e.dir === 'recv' && e.topic === EMPTY_TOPIC && e.event === 'phx_reply' && e.ref === emptyJoin.ref, JOIN_TIMEOUT_MS),
    ])

    const rel = (t) => (t === null || t === undefined ? null : round(t - emptyJoin.t))
    Object.assign(out, {
      emptyJoinRef: emptyJoin.ref,
      emptyReplyMs: emptyReply ? round(emptyReply.t - emptyJoin.t) : null,
      emptyReplyStatus: emptyReply?.status ?? null,
      insertStartRel: rel(insert.start),
      insertEndRel: rel(insert.end),
      insertRequestMs: round(insert.end - insert.start),
      changeFrameRel: rel(change?.t),
      changeAfterInsertStartMs: change ? round(change.t - insert.start) : null,
      paintAfterInsertStartMs: painted ? round(painted - insert.start) : null,
      paintAfterChangeFrameMs: painted && change ? round(painted - change.t) : null,
      emptyReplyRel: rel(emptyReply?.t),
      changeMinusEmptyReplyMs: change && emptyReply ? round(change.t - emptyReply.t) : null,
      emptyPendingAtInsertStart: emptyReply ? emptyReply.t > insert.start : true,
    })

    // realtime-js는 대기 중에도 phx_leave + phx_join을 추가로 보내므로, 기준 요청 하나가 아니라
    // 삽입 시점에 응답을 받지 못한 빈 토픽 요청 전부와 메시지 직전의 빈 토픽 응답을 본다
    const emptySends = pw.filter((e) => e.dir === 'send' && e.topic === EMPTY_TOPIC)
    const replyOf = (send) =>
      pw.find((e) => e.dir === 'recv' && e.topic === EMPTY_TOPIC && e.event === 'phx_reply' && e.ref === send.ref)
    const pendingAt = (t) =>
      emptySends
        .filter((send) => {
          const reply = replyOf(send)
          return send.t <= t && !(reply && reply.t <= t)
        })
        .map((send) => `${send.event}#${send.ref}`)
    out.emptyPendingRequestsAtInsertStart = pendingAt(insert.start)
    if (change) {
      const lastEmptyReply = pw
        .filter((e) => e.dir === 'recv' && e.topic === EMPTY_TOPIC && e.event === 'phx_reply' && e.t <= change.t)
        .at(-1)
      out.changeMinusLastEmptyReplyMs = lastEmptyReply ? round(change.t - lastEmptyReply.t) : null
      out.lastEmptyReplyBeforeChange = lastEmptyReply ? `ref=${lastEmptyReply.ref}:${lastEmptyReply.status}` : null
    }

    // CDP 기준 같은 프레임 간격
    const cdpEmptyJoin = proto.find((e) => e.dir === 'send' && e.topic === EMPTY_TOPIC && e.event === 'phx_join' && e.ref === emptyJoin.ref)
    const cdpEmptyReply = proto.find((e) => e.dir === 'recv' && e.topic === EMPTY_TOPIC && e.event === 'phx_reply' && e.ref === emptyJoin.ref)
    const cdpChange = proto.find((e) => e.dir === 'recv' && e.event === 'postgres_changes' && e.content === content)
    out.cdp = {
      emptyReplyMs: cdpEmptyJoin && cdpEmptyReply ? round(cdpEmptyReply.ts - cdpEmptyJoin.ts) : null,
      changeMinusEmptyReplyMs: cdpChange && cdpEmptyReply ? round(cdpChange.ts - cdpEmptyReply.ts) : null,
    }
    out.socketCount = new Set(proto.filter((e) => e.kind === 'socket:created').map((e) => e.requestId)).size

    if (!change) out.status = 'change_timeout'
    else if (!painted) out.status = 'paint_timeout'
    else if (!emptyReply) out.status = 'empty_reply_timeout'
  } catch (error) {
    out.status = 'error'
    out.error = error.message.split('\n')[0]
  } finally {
    await context.close()
    await deleteRunMessages(nbreadId)
  }

  // 모든 빈 토픽 접속 요청→응답 쌍 (재시도 포함). 두 시계로 각각
  out.emptyPairs = pw
    .filter((e) => e.dir === 'send' && e.topic === EMPTY_TOPIC && e.event === 'phx_join')
    .map((send) => {
      const reply = pw.find((e) => e.dir === 'recv' && e.topic === EMPTY_TOPIC && e.event === 'phx_reply' && e.ref === send.ref)
      const cdpSend = proto.find((e) => e.dir === 'send' && e.topic === EMPTY_TOPIC && e.event === 'phx_join' && e.ref === send.ref)
      const cdpReply = proto.find((e) => e.dir === 'recv' && e.topic === EMPTY_TOPIC && e.event === 'phx_reply' && e.ref === send.ref)
      return {
        ref: send.ref,
        playwrightCallbackMs: reply ? round(reply.t - send.t) : null,
        cdpProtocolMs: cdpSend && cdpReply ? round(cdpReply.ts - cdpSend.ts) : null,
        replyStatus: reply?.status ?? null,
      }
    })
  const tsBase = proto.find((e) => typeof e.ts === 'number')?.ts ?? 0
  out.playwrightEvents = relativeEvents(pw.filter((e) => e.topic !== 'phoenix'), base)
  out.cdpEvents = proto
    .filter((e) => e.topic !== 'phoenix')
    .map((e) => (typeof e.ts === 'number' ? { ...e, ts: round(e.ts - tsBase) } : e))
  return out
}

// ─────────────────────────────── main ───────────────────────────────

const summarizeRaw = (runs) => {
  const groups = {}
  for (const r of runs.filter((x) => x.part === 'raw')) {
    const key = `${r.condition}@${r.offsetMs}`
    groups[key] ??= []
    groups[key].push(r)
  }
  return Object.fromEntries(
    Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))
      .map(([key, list]) => {
        const ok = list.filter((r) => r.status === 'ok')
        return [
          key,
          {
            runs: list.length,
            ok: ok.length,
            emptyPendingAtInsertStart: ok.filter((r) => r.emptyPendingAtInsertStart === true).length,
            changeAfterInsertStartMs: stats(ok.map((r) => r.changeAfterInsertStartMs)),
            changeAfterInsertEndMs: stats(ok.map((r) => r.changeAfterInsertEndMs)),
            changeMinusEmptyReplyMs: stats(ok.map((r) => r.changeMinusEmptyReplyMs)),
            emptyReplyMs: stats(ok.map((r) => r.emptyReplyMs)),
            insertRequestMs: stats(ok.map((r) => r.insertRequestMs)),
            normalJoinReplyMs: stats(ok.map((r) => r.normalJoinReplyMs)),
          },
        ]
      }),
  )
}

const summarizeOrder = (runs) =>
  Object.fromEntries(
    ORDERS.map((order) => {
      const list = runs.filter((r) => r.part === 'order' && r.order === order)
      const ok = list.filter((r) => r.status === 'ok')
      return [
        order,
        {
          runs: list.length,
          ok: ok.length,
          normalReplyMs: stats(ok.map((r) => r.normalReplyMs)),
          emptyReplyMs: stats(ok.map((r) => r.emptyReplyMs)),
          systemMs: stats(ok.map((r) => r.systemMs)),
          normalMinusEmptyReplyMs: stats(ok.map((r) => r.normalMinusEmptyReplyMs)),
          replyOrders: [...new Set(ok.map((r) => r.replyOrder.map((s) => s.replace(/:ref=[^:]+/, '')).join(' → ')))],
        },
      ]
    }),
  )

const summarizeApp = (runs) =>
  Object.fromEntries(
    OFFSETS_MS.map((offsetMs) => {
      const list = runs.filter((r) => r.part === 'app' && r.offsetMs === offsetMs)
      const ok = list.filter((r) => r.status === 'ok')
      return [
        `A@${offsetMs}`,
        {
          runs: list.length,
          ok: ok.length,
          emptyPendingAtInsertStart: ok.filter((r) => r.emptyPendingAtInsertStart).length,
          pendingRequestCountAtInsertStart: ok.map((r) => r.emptyPendingRequestsAtInsertStart?.length ?? null),
          changeAfterInsertStartMs: stats(ok.map((r) => r.changeAfterInsertStartMs)),
          changeMinusLastEmptyReplyMs: stats(ok.map((r) => r.changeMinusLastEmptyReplyMs)),
          paintAfterInsertStartMs: stats(ok.map((r) => r.paintAfterInsertStartMs)),
          paintAfterChangeFrameMs: stats(ok.map((r) => r.paintAfterChangeFrameMs)),
          changeMinusEmptyReplyMs: stats(ok.map((r) => r.changeMinusEmptyReplyMs)),
          cdpChangeMinusEmptyReplyMs: stats(ok.map((r) => r.cdp?.changeMinusEmptyReplyMs)),
        },
      ]
    }),
  )

const main = async () => {
  log('운영 테스트 계정 생성')
  if (existsSync(SETUP_JSON)) rmSync(SETUP_JSON)
  node(['scripts/perf/setup-test-accounts.mjs', '--out', SETUP_JSON], { quiet: true })
  const setup = JSON.parse(readFileSync(SETUP_JSON, 'utf8'))
  const viewer = await captureSession(setup.accounts[0])
  const sender = await captureSession(setup.accounts[1])
  const ctx = { viewer, sender, senderAccount: setup.accounts[1], nbreadId: setup.nbreadId }
  const runs = []
  const result = { experiment: 2, tracedAt: new Date().toISOString(), reps: REPS, offsetsMs: OFFSETS_MS, parts: PARTS }

  const save = () => {
    const path = saveJson('realtime-rootcause-exp2-socket-isolation', {
      ...result,
      finishedAt: new Date().toISOString(),
      summary: {
        raw: summarizeRaw(runs),
        order: summarizeOrder(runs),
        app: summarizeApp(runs),
        failures: runs
          .filter((r) => r.status !== 'ok')
          .map(({ part, condition, order, offsetMs, rep, status, error }) => ({ part, condition, order, offsetMs, rep, status, error })),
      },
      runs,
    })
    log(`저장: ${path}`)
  }

  try {
    if (PARTS.includes('raw')) {
      const plan = []
      for (let rep = 0; rep < REPS; rep += 1) {
        rotate(OFFSETS_MS, rep).forEach((offsetMs, i) => {
          for (const condition of rotate(CONDITIONS, rep + i)) plan.push({ condition, offsetMs, rep })
        })
      }
      for (const [index, item] of plan.entries()) {
        const r = await rawRun(ctx, item)
        r.seq = index
        runs.push(r)
        log(
          `raw ${index + 1}/${plan.length} ${item.condition}@${item.offsetMs} ${r.status} ` +
            `empty=${r.emptyReplyMs} change-insert=${r.changeAfterInsertStartMs} change-emptyReply=${r.changeMinusEmptyReplyMs}${r.error ? ` ${r.error}` : ''}`,
        )
        await sleep(GAP_MS)
      }
    }

    if (PARTS.includes('order')) {
      const plan = []
      for (let rep = 0; rep < REPS; rep += 1) for (const order of rotate(ORDERS, rep)) plan.push({ order, rep })
      for (const [index, item] of plan.entries()) {
        const r = await orderRun(ctx, item)
        r.seq = index
        runs.push(r)
        log(`order ${index + 1}/${plan.length} ${item.order} ${r.status} normal=${r.normalReplyMs} empty=${r.emptyReplyMs} system=${r.systemMs}`)
        await sleep(GAP_MS)
      }
    }

    if (PARTS.includes('app')) {
      log(`개선 전 서버 기동 (:${PORT})`)
      await startServer()
      const injection = {
        script: ({ storageKey, storageValue, userStore }) => {
          localStorage.setItem(storageKey, storageValue)
          localStorage.setItem('user-store', userStore)
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
      const plan = []
      for (let rep = 0; rep < REPS; rep += 1) for (const offsetMs of rotate(OFFSETS_MS, rep)) plan.push({ offsetMs, rep })
      for (const [index, item] of plan.entries()) {
        const r = await appRun(ctx, browser, injection, item)
        r.seq = index
        runs.push(r)
        log(
          `app ${index + 1}/${plan.length} A@${item.offsetMs} ${r.status} empty=${r.emptyReplyMs} ` +
            `change-insert=${r.changeAfterInsertStartMs} paint-insert=${r.paintAfterInsertStartMs}${r.error ? ` ${r.error}` : ''}`,
        )
      }
      await browser.close()
    }
  } finally {
    save()
  }
}

const cleanup = async () => {
  try {
    if (existsSync(SETUP_JSON)) {
      log('운영 테스트 데이터 정리')
      node(['scripts/perf/cleanup-test-accounts.mjs', SETUP_JSON])
      rmSync(SETUP_JSON)
    }
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    for (const user of (data?.users ?? []).filter((u) => (u.email ?? '').startsWith(TEST_EMAIL_PREFIX))) {
      await admin.auth.admin.deleteUser(user.id)
      console.log(`  고아 계정 삭제 ${user.id}`)
    }
    const { data: nbreads } = await admin.from('nbread').select('id, title')
    for (const row of (nbreads ?? []).filter((r) => (r.title ?? '').startsWith('[PERF]'))) {
      await admin.from('chat_messages').delete().eq('nbread_id', row.id)
      await admin.from('participant').delete().eq('nbread_id', row.id)
      await admin.from('nbread').delete().eq('id', row.id)
      console.log(`  고아 엔빵 삭제 ${row.id}`)
    }
    const { count } = await admin
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .like('content', `${CONTENT_PREFIX}%`)
    log(`잔존 실험 메시지(${CONTENT_PREFIX}*): ${count}건`)
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
  }
}

main()
  .then(cleanup)
  .catch(async (error) => {
    console.error(`\n실패: ${error.message}`)
    await cleanup()
    process.exit(1)
  })
