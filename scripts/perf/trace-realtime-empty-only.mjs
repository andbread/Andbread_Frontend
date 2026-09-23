/**
 * 실험 1. 빈 토픽만 접속
 * (docs/performance/realtime-delay-root-cause-experiment-plan.md)
 *
 * 새 웹소켓에서 `realtime:`만 한 번 접속하고 첫 phx_reply까지 잰다. 정상 토픽 접속과
 * 메시지 삽입은 하지 않는다. 첫 응답 뒤 소켓을 닫아 재시도가 다음 회차에 섞이지 않게 한다.
 * 운영 DB에는 아무것도 쓰지 않는다.
 *
 * 두 방법을 ABBA 순서로 번갈아 반복한다.
 *   node    : 독립 웹소켓 클라이언트, performance.now()
 *   browser : 앱 없이 about:blank에서 브라우저 WebSocket을 연다. 같은 프레임을
 *             Playwright 콜백 Date.now(), CDP Network 이벤트 timestamp,
 *             페이지 안 performance.now() 세 가지로 기록한다.
 *
 * 실행: node scripts/perf/trace-realtime-empty-only.mjs [--runs 12]
 */

import { chromium } from '@playwright/test'
import {
  EMPTY_TOPIC,
  PhoenixSocket,
  describeFrame,
  joinPayload,
  loadEnv,
  log,
  realtimeUrl,
  redactUrl,
  round,
  saveJson,
  sleep,
  stats,
  summarizePayload,
} from './realtime-rootcause-lib.mjs'

const runsArg = process.argv.indexOf('--runs')
const RUNS_PER_METHOD = runsArg !== -1 ? Number(process.argv[runsArg + 1]) : 12
const CPU_THROTTLE_RATE = 4 // 기존 추적과 같은 조건
const REPLY_TIMEOUT_MS = 15_000
const GAP_MS = 1_000

const env = loadEnv()
const url = realtimeUrl(env)

/** 응답 헤더 중 버전 단서가 될 만한 것만 남긴다 (실험 4 참고용) */
const safeHeaders = (headers = {}) =>
  Object.fromEntries(
    Object.entries(headers).filter(
      ([name]) => !/cookie|authorization|apikey|token|key/i.test(name),
    ),
  )

const runNode = async (runIndex) => {
  const events = []
  const socket = new PhoenixSocket({ id: 1, url, events })
  const result = { method: 'node', runIndex, events }
  try {
    await socket.open()
    const sent = socket.join(EMPTY_TOPIC, joinPayload())
    const reply = await socket.waitReply(sent, REPLY_TIMEOUT_MS)
    result.status = reply ? 'ok' : 'timeout'
    result.replyStatus = reply?.status ?? null
    result.replyReason = reply?.reason ?? null
    result.emptyReplyMs = { node: reply ? round(reply.t - sent.t) : null }
  } catch (error) {
    result.status = 'error'
    result.error = error.message
  } finally {
    await socket.close()
  }
  // t를 회차 시작 기준 상대값으로 바꿔 저장한다
  const base = events[0]?.t ?? 0
  result.events = events.map((e) => ({ ...e, t: round(e.t - base) }))
  return result
}

const runBrowser = async (browser, runIndex) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE })
  await cdp.send('Network.enable')

  const t0 = Date.now()
  const pw = [] // Playwright 콜백 시각 (Node Date.now)
  const proto = [] // CDP timestamp (브라우저 단조 시계, 초 → ms)
  const result = { method: 'browser', runIndex, cpuThrottleRate: CPU_THROTTLE_RATE }

  page.on('websocket', (ws) => {
    pw.push({ at: Date.now() - t0, kind: 'socket:open', url: redactUrl(ws.url()) })
    ws.on('framesent', (frame) => {
      const f = describeFrame(frame.payload)
      pw.push({ at: Date.now() - t0, dir: 'send', topic: f.topic, event: f.event, ref: f.ref })
    })
    ws.on('framereceived', (frame) => {
      const f = describeFrame(frame.payload)
      pw.push({ at: Date.now() - t0, dir: 'recv', topic: f.topic, event: f.event, ref: f.ref, ...summarizePayload(f.payload) })
    })
    ws.on('close', () => pw.push({ at: Date.now() - t0, kind: 'socket:close' }))
  })

  cdp.on('Network.webSocketCreated', (e) => proto.push({ kind: 'socket:created', requestId: e.requestId, url: redactUrl(e.url) }))
  cdp.on('Network.webSocketHandshakeResponseReceived', (e) => {
    proto.push({ ts: e.timestamp * 1000, kind: 'handshake', requestId: e.requestId, status: e.response.status })
    result.handshakeHeaders = safeHeaders(e.response.headers)
  })
  cdp.on('Network.webSocketFrameSent', (e) => {
    const f = describeFrame(e.response.payloadData)
    proto.push({ ts: e.timestamp * 1000, dir: 'send', requestId: e.requestId, topic: f.topic, event: f.event, ref: f.ref })
  })
  cdp.on('Network.webSocketFrameReceived', (e) => {
    const f = describeFrame(e.response.payloadData)
    proto.push({ ts: e.timestamp * 1000, dir: 'recv', requestId: e.requestId, topic: f.topic, event: f.event, ref: f.ref, ...summarizePayload(f.payload) })
  })
  cdp.on('Network.webSocketClosed', (e) => proto.push({ ts: e.timestamp * 1000, kind: 'socket:close', requestId: e.requestId }))

  try {
    await page.goto('about:blank')
    // 페이지 안에서 소켓을 열고, 보낸 시각과 받은 시각을 페이지 시계로도 잰다
    const inPage = await page.evaluate(
      ({ url, topic, payload, timeoutMs }) =>
        new Promise((resolve) => {
          const ws = new WebSocket(url)
          const out = { openedAt: null, sentAt: null, replyAt: null, status: 'timeout' }
          const timer = setTimeout(() => {
            ws.close()
            resolve(out)
          }, timeoutMs)
          ws.onopen = () => {
            out.openedAt = performance.now()
            out.sentAt = performance.now()
            ws.send(JSON.stringify({ topic, event: 'phx_join', payload, ref: '1', join_ref: '1' }))
          }
          ws.onmessage = (message) => {
            const frame = JSON.parse(message.data)
            if (frame.topic === topic && frame.event === 'phx_reply' && frame.ref === '1') {
              out.replyAt = performance.now()
              out.status = 'ok'
              clearTimeout(timer)
              ws.close()
              resolve(out)
            }
          }
        }),
      { url, topic: EMPTY_TOPIC, payload: joinPayload(), timeoutMs: REPLY_TIMEOUT_MS },
    )
    // close 이벤트가 기록될 시간을 준다
    await sleep(300)

    const pwSend = pw.find((e) => e.dir === 'send' && e.topic === EMPTY_TOPIC && e.event === 'phx_join')
    const pwReply = pw.find((e) => e.dir === 'recv' && e.topic === EMPTY_TOPIC && e.event === 'phx_reply' && e.ref === '1')
    const cdpSend = proto.find((e) => e.dir === 'send' && e.topic === EMPTY_TOPIC && e.event === 'phx_join')
    const cdpReply = proto.find((e) => e.dir === 'recv' && e.topic === EMPTY_TOPIC && e.event === 'phx_reply' && e.ref === '1')

    result.status = inPage.status
    result.replyStatus = cdpReply?.status ?? pwReply?.status ?? null
    result.replyReason = cdpReply?.reason ?? pwReply?.reason ?? null
    result.emptyReplyMs = {
      playwrightCallback: pwSend && pwReply ? pwReply.at - pwSend.at : null,
      cdpProtocol: cdpSend && cdpReply ? round(cdpReply.ts - cdpSend.ts) : null,
      inPage: inPage.replyAt !== null ? round(inPage.replyAt - inPage.sentAt) : null,
    }
    result.socketCount = new Set(proto.filter((e) => e.kind === 'socket:created').map((e) => e.requestId)).size
  } catch (error) {
    result.status = 'error'
    result.error = error.message.split('\n')[0]
  } finally {
    await context.close()
  }

  const tsBase = proto.find((e) => typeof e.ts === 'number')?.ts ?? 0
  result.playwrightEvents = pw
  result.cdpEvents = proto.map((e) => (typeof e.ts === 'number' ? { ...e, ts: round(e.ts - tsBase) } : e))
  return result
}

const main = async () => {
  const browser = await chromium.launch()
  const runs = []
  // ABBA: node, browser, browser, node, ...
  const order = []
  for (let i = 0; i < RUNS_PER_METHOD; i += 1) {
    order.push(...(i % 2 === 0 ? ['node', 'browser'] : ['browser', 'node']))
  }

  const counters = { node: 0, browser: 0 }
  for (const [index, method] of order.entries()) {
    const runIndex = counters[method]
    counters[method] += 1
    const result = method === 'node' ? await runNode(runIndex) : await runBrowser(browser, runIndex)
    result.order = index
    runs.push(result)
    const ms = Object.entries(result.emptyReplyMs ?? {})
      .map(([k, v]) => `${k}=${v}`)
      .join(' ')
    log(`${index + 1}/${order.length} ${method}#${runIndex + 1} ${result.status} ${result.replyStatus ?? ''} ${ms}`)
    await sleep(GAP_MS)
  }
  await browser.close()

  const pick = (method, key) => runs.filter((r) => r.method === method).map((r) => r.emptyReplyMs?.[key])
  const summary = {
    node: stats(pick('node', 'node')),
    browserPlaywrightCallback: stats(pick('browser', 'playwrightCallback')),
    browserCdpProtocol: stats(pick('browser', 'cdpProtocol')),
    browserInPage: stats(pick('browser', 'inPage')),
    failures: runs.filter((r) => r.status !== 'ok').map((r) => ({ method: r.method, runIndex: r.runIndex, status: r.status, error: r.error })),
    replyReasons: [...new Set(runs.map((r) => `${r.replyStatus}:${r.replyReason}`))],
  }

  const path = saveJson('realtime-rootcause-exp1-empty-only', {
    experiment: 1,
    tracedAt: new Date().toISOString(),
    runsPerMethod: RUNS_PER_METHOD,
    cpuThrottleRate: CPU_THROTTLE_RATE,
    note: '빈 토픽 접속 요청만 보낸다. 운영 DB 쓰기 없음. 시각은 방법별 자기 시계 기준 간격만 비교한다.',
    summary,
    runs,
  })
  console.log(JSON.stringify(summary, null, 2))
  console.log(`저장: ${path}`)
}

main().catch((error) => {
  console.error(`실패: ${error.message}`)
  process.exit(1)
})
