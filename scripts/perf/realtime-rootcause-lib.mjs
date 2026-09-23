/**
 * Realtime 지연 원인 확인 실험(docs/performance/realtime-delay-root-cause-experiment-plan.md)의
 * 공통 모듈.
 *
 * - 독립 웹소켓 클라이언트: Node 내장 WebSocket으로 Phoenix 프로토콜(vsn 1.0.0)을 직접
 *   주고받는다. realtime-js의 자동 재시도가 끼어들지 않으므로 참조값과 순서를 통제할 수 있다.
 *   시각은 performance.now()(단조 증가 시계)로 기록한다.
 * - 기록에는 토큰·키·세션값을 남기지 않는다. 접속 주소의 apikey는 지운다.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'

export const ROOT = process.cwd()
export const EXPECTED_PROJECT_REF = 'yyisakaqnaoomehqlyjz'
export const EMPTY_TOPIC = 'realtime:'

export const log = (message) => console.log(`[${new Date().toLocaleTimeString('ko-KR')}] ${message}`)
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
export const now = () => performance.now()
export const round = (value) => (value === null || value === undefined ? null : Math.round(value * 10) / 10)

export const parseEnv = (path) =>
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

export const loadEnv = () => {
  const env = parseEnv(join(ROOT, '.env'))
  if (!env.NEXT_PUBLIC_SUPABASE_URL.includes(EXPECTED_PROJECT_REF)) {
    throw new Error('운영 프로젝트를 가리키는 .env가 아닙니다')
  }
  return env
}

export const realtimeUrl = (env) =>
  `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/^http/, 'ws')}/realtime/v1/websocket?apikey=${env.NEXT_PUBLIC_SUPABASE_KEY}&vsn=1.0.0`

/** 접속 주소의 키 매개변수를 지운다 */
export const redactUrl = (url) => url.replace(/(apikey|access_token|token)=[^&]*/gi, '$1=<redacted>')

/** realtime-js 2.89.0 RealtimeChannel.subscribe()가 만드는 접속 요청과 같은 형태 */
export const joinPayload = ({ postgresChanges = [], accessToken } = {}) => ({
  config: {
    broadcast: { ack: false, self: false },
    presence: { key: '', enabled: false },
    postgres_changes: postgresChanges,
    private: false,
  },
  ...(accessToken ? { access_token: accessToken } : {}),
})

export const chatChanges = (nbreadId) => [
  { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `nbread_id=eq.${nbreadId}` },
]

/**
 * Phoenix 프레임을 읽는다. vsn 1.0.0은 객체, 2.0.0은 배열 형태다.
 */
export const describeFrame = (raw) => {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { topic: null, event: null, ref: null, joinRef: null, payload: null }
  }
  if (Array.isArray(parsed)) {
    const [joinRef, ref, topic, event, payload] = parsed
    return { joinRef, ref, topic, event, payload }
  }
  return {
    joinRef: parsed.join_ref ?? null,
    ref: parsed.ref ?? null,
    topic: parsed.topic,
    event: parsed.event,
    payload: parsed.payload,
  }
}

/** 기록에 남길 요약. 토큰이나 레코드 전체는 남기지 않는다 */
export const summarizePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return {}
  const out = {}
  if (payload.status) out.status = payload.status
  const reason = payload.response?.reason ?? payload.response?.message ?? payload.message
  if (reason) out.reason = String(reason).slice(0, 120)
  const content = payload.data?.record?.content ?? payload.record?.content
  if (content) out.content = content
  if (payload.extension) out.extension = payload.extension
  if (payload.channel) out.channel = payload.channel
  return out
}

/**
 * 독립 웹소켓 클라이언트. 모든 프레임을 events 배열에 쌓는다.
 * 각 이벤트: { t(performance.now ms), socket, dir, kind, topic, event, ref, joinRef, ...summary }
 */
export class PhoenixSocket {
  constructor({ id, url, events }) {
    this.id = id
    this.url = url
    this.events = events
    this.refSeq = 0
    this.waiters = []
    this.heartbeat = null
    this.closed = false
  }

  record(entry) {
    const event = { t: now(), socket: this.id, ...entry }
    this.events.push(event)
    for (const waiter of [...this.waiters]) {
      if (waiter.predicate(event)) {
        this.waiters.splice(this.waiters.indexOf(waiter), 1)
        clearTimeout(waiter.timer)
        waiter.resolve(event)
      }
    }
    return event
  }

  open(timeoutMs = 15_000) {
    return new Promise((resolve, reject) => {
      const startedAt = now()
      this.ws = new WebSocket(this.url)
      const timer = setTimeout(() => reject(new Error(`소켓${this.id} 열기 타임아웃`)), timeoutMs)
      this.ws.addEventListener('open', () => {
        clearTimeout(timer)
        this.record({ dir: 'local', kind: 'socket:open', url: redactUrl(this.url), openMs: round(now() - startedAt) })
        this.heartbeat = setInterval(() => this.send('phoenix', 'heartbeat', {}), 25_000)
        resolve()
      })
      this.ws.addEventListener('message', (message) => {
        const f = describeFrame(String(message.data))
        this.record({
          dir: 'recv',
          kind: 'frame',
          topic: f.topic,
          event: f.event,
          ref: f.ref,
          joinRef: f.joinRef,
          ...summarizePayload(f.payload),
        })
      })
      this.ws.addEventListener('close', (e) => {
        this.closed = true
        clearInterval(this.heartbeat)
        this.record({ dir: 'local', kind: 'socket:close', code: e.code })
      })
      this.ws.addEventListener('error', () => {
        this.record({ dir: 'local', kind: 'socket:error' })
      })
    })
  }

  /** 프레임을 보내고 보낸 이벤트 기록을 돌려준다 */
  send(topic, event, payload, joinRef = null) {
    this.refSeq += 1
    const ref = String(this.refSeq)
    const entry = this.record({ dir: 'send', kind: 'frame', topic, event, ref, joinRef: joinRef ?? null })
    this.ws.send(JSON.stringify({ topic, event, payload, ref, join_ref: joinRef }))
    return entry
  }

  join(topic, payload) {
    const nextRef = String(this.refSeq + 1)
    return this.send(topic, 'phx_join', payload, nextRef)
  }

  /** 이미 받은 이벤트 중 조건에 맞는 것이 있으면 바로, 없으면 도착을 기다린다. 타임아웃이면 null */
  waitFor(predicate, timeoutMs, { since = 0 } = {}) {
    const existing = this.events.find((e) => e.socket === this.id && e.t >= since && predicate(e))
    if (existing) return Promise.resolve(existing)
    return new Promise((resolve) => {
      const waiter = {
        predicate: (e) => e.socket === this.id && predicate(e),
        resolve,
        timer: setTimeout(() => {
          this.waiters.splice(this.waiters.indexOf(waiter), 1)
          resolve(null)
        }, timeoutMs),
      }
      this.waiters.push(waiter)
    })
  }

  waitReply(sent, timeoutMs) {
    return this.waitFor(
      (e) => e.dir === 'recv' && e.event === 'phx_reply' && e.topic === sent.topic && e.ref === sent.ref,
      timeoutMs,
      { since: sent.t },
    )
  }

  async close() {
    if (this.closed || !this.ws) return
    clearInterval(this.heartbeat)
    const closing = this.waitFor((e) => e.kind === 'socket:close', 3_000)
    this.ws.close(1000)
    await closing
  }
}

/** 기존 파일을 덮어쓰지 않는 저장 경로를 만든다 */
export const outputPath = (name) => {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const dir = join(ROOT, 'docs/performance/results', stamp)
  mkdirSync(dir, { recursive: true })
  let path = join(dir, `${name}.json`)
  for (let i = 2; existsSync(path); i += 1) path = join(dir, `${name}-${i}.json`)
  return path
}

export const saveJson = (name, data) => {
  const path = outputPath(name)
  const text = JSON.stringify(data, null, 2)
  // 저장 전 마지막 확인: 키·토큰 모양의 값이 들어가지 않았는지
  if (/sb_publishable_|sb_secret_|eyJhbGciOi/.test(text)) {
    throw new Error(`저장 중단: 결과에 키 또는 토큰 모양의 값이 있습니다 (${name})`)
  }
  writeFileSync(path, text)
  return path
}

export const stats = (values) => {
  const list = values.filter((v) => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b)
  if (list.length === 0) return { n: 0 }
  const q = (p) => {
    const index = (list.length - 1) * p
    const lo = Math.floor(index)
    const hi = Math.ceil(index)
    return list[lo] + (list[hi] - list[lo]) * (index - lo)
  }
  return {
    n: list.length,
    min: round(list[0]),
    p25: round(q(0.25)),
    median: round(q(0.5)),
    p75: round(q(0.75)),
    max: round(list[list.length - 1]),
  }
}
