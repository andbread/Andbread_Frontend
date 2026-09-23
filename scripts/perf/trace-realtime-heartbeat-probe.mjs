/**
 * 실험 1 보조. heartbeat로 같은 소켓의 처리 막힘 확인
 * (docs/performance/realtime-delay-root-cause-experiment-plan.md)
 *
 * Phoenix 소켓은 `phoenix` 토픽의 heartbeat를 채널 프로세스를 거치지 않고 소켓 프로세스에서
 * 바로 응답한다(supabase/phoenix lib/phoenix/socket.ex handle_in heartbeat).
 * 따라서
 *   1) 빈 토픽 요청 전 heartbeat 왕복 시간 = 기준 왕복 시간
 *   2) 빈 토픽 요청 후 HB_DELAYS_MS 시점에 보낸 heartbeat의 응답이
 *      빈 토픽 오류 응답 뒤로 밀리는가
 * 를 본다. 운영 DB에는 아무것도 쓰지 않는다. 독립 웹소켓 클라이언트, performance.now().
 *
 * 실행: node scripts/perf/trace-realtime-heartbeat-probe.mjs [--runs 12]
 */

import {
  EMPTY_TOPIC,
  PhoenixSocket,
  joinPayload,
  loadEnv,
  log,
  now,
  realtimeUrl,
  round,
  saveJson,
  sleep,
  stats,
} from './realtime-rootcause-lib.mjs'

const runsArg = process.argv.indexOf('--runs')
const RUNS = runsArg !== -1 ? Number(process.argv[runsArg + 1]) : 12
const BASELINE_HEARTBEATS = 3
const HB_DELAYS_MS = [1000, 2500] // 빈 토픽 요청 후 heartbeat를 보낼 시점
const TIMEOUT_MS = 15_000

const url = realtimeUrl(loadEnv())

const heartbeat = async (socket) => {
  const sent = socket.send('phoenix', 'heartbeat', {})
  const reply = await socket.waitReply(sent, TIMEOUT_MS)
  return { sent, reply }
}

const runOnce = async (runIndex) => {
  const events = []
  const socket = new PhoenixSocket({ id: 1, url, events })
  const out = { runIndex, status: 'ok' }
  try {
    await socket.open()
    const baseline = []
    for (let i = 0; i < BASELINE_HEARTBEATS; i += 1) {
      const { sent, reply } = await heartbeat(socket)
      baseline.push(reply ? round(reply.t - sent.t) : null)
      await sleep(200)
    }
    out.baselineHeartbeatMs = baseline

    const emptyJoin = socket.join(EMPTY_TOPIC, joinPayload())
    const probes = HB_DELAYS_MS.map(async (delay) => {
      await sleep(Math.max(0, emptyJoin.t + delay - now()))
      const { sent, reply } = await heartbeat(socket)
      return { delayMs: delay, sent, reply }
    })
    const emptyReply = await socket.waitReply(emptyJoin, TIMEOUT_MS)
    const probed = await Promise.all(probes)

    out.emptyReplyMs = emptyReply ? round(emptyReply.t - emptyJoin.t) : null
    out.emptyReplyStatus = emptyReply?.status ?? null
    out.probes = probed.map(({ delayMs, sent, reply }) => ({
      delayMs,
      heartbeatReplyMs: reply ? round(reply.t - sent.t) : null,
      // 음수면 heartbeat 응답이 빈 토픽 오류보다 먼저 왔다
      replyMinusEmptyReplyMs: reply && emptyReply ? round(reply.t - emptyReply.t) : null,
    }))
    // 모든 heartbeat 응답이 끝난 뒤 한 번 더 재서 막힘이 풀렸는지 본다
    const after = await heartbeat(socket)
    out.afterHeartbeatMs = after.reply ? round(after.reply.t - after.sent.t) : null
    if (!emptyReply || probed.some((p) => !p.reply)) out.status = 'timeout'
  } catch (error) {
    out.status = 'error'
    out.error = error.message
  } finally {
    await socket.close()
  }
  const base = events[0]?.t ?? 0
  out.events = events.filter(Boolean).map((e) => ({ ...e, t: round(e.t - base) }))
  return out
}

const main = async () => {
  const runs = []
  for (let i = 0; i < RUNS; i += 1) {
    const r = await runOnce(i)
    runs.push(r)
    log(
      `${i + 1}/${RUNS} ${r.status} baseline=${r.baselineHeartbeatMs?.join('/')} empty=${r.emptyReplyMs} ` +
        (r.probes ?? []).map((p) => `hb@${p.delayMs}=${p.heartbeatReplyMs}(${p.replyMinusEmptyReplyMs})`).join(' ') +
        ` after=${r.afterHeartbeatMs}`,
    )
    await sleep(1000)
  }
  const ok = runs.filter((r) => r.status === 'ok')
  const summary = {
    baselineHeartbeatMs: stats(ok.flatMap((r) => r.baselineHeartbeatMs)),
    emptyReplyMs: stats(ok.map((r) => r.emptyReplyMs)),
    emptyReplyMinusBaselineMedianMs: stats(
      ok.map((r) => {
        const sorted = [...r.baselineHeartbeatMs].sort((a, b) => a - b)
        return r.emptyReplyMs - sorted[Math.floor(sorted.length / 2)]
      }),
    ),
    probes: Object.fromEntries(
      HB_DELAYS_MS.map((delay) => [
        `hb@${delay}`,
        {
          heartbeatReplyMs: stats(ok.map((r) => r.probes.find((p) => p.delayMs === delay)?.heartbeatReplyMs)),
          replyMinusEmptyReplyMs: stats(ok.map((r) => r.probes.find((p) => p.delayMs === delay)?.replyMinusEmptyReplyMs)),
        },
      ]),
    ),
    afterHeartbeatMs: stats(ok.map((r) => r.afterHeartbeatMs)),
    failures: runs.filter((r) => r.status !== 'ok').map(({ runIndex, status, error }) => ({ runIndex, status, error })),
  }
  const path = saveJson('realtime-rootcause-exp1b-heartbeat-probe', {
    experiment: '1b',
    tracedAt: new Date().toISOString(),
    runCount: RUNS,
    heartbeatDelaysMs: HB_DELAYS_MS,
    note: '빈 토픽 접속과 heartbeat만 보낸다. 운영 DB 쓰기 없음.',
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
