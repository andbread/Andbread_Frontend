/**
 * 실험 3. 측정 시각 교차 검증 + 실험 1·2 요약
 * (docs/performance/realtime-delay-root-cause-experiment-plan.md)
 *
 * 새로 측정하지 않고, 저장된 원시 결과를 읽어 방법별 빈 토픽 요청→오류 응답 분포와
 * 같은 프레임에 대한 시계 간 차이를 계산한다.
 *
 * 실행: node scripts/perf/analyze-realtime-rootcause.mjs <결과 폴더>
 *   예) node scripts/perf/analyze-realtime-rootcause.mjs docs/performance/results/20260923
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { EMPTY_TOPIC, saveJson, stats } from './realtime-rootcause-lib.mjs'

const dir = process.argv[2]
if (!dir) throw new Error('사용법: node scripts/perf/analyze-realtime-rootcause.mjs <결과 폴더>')

const read = (name) => {
  const path = join(dir, name)
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null
}

const exp1 = read('realtime-rootcause-exp1-empty-only.json')
const exp1b = read('realtime-rootcause-exp1b-heartbeat-probe.json')
const exp2 = read('realtime-rootcause-exp2-socket-isolation.json')
const legacy = read('realtime-trace.json')

const out = { analyzedAt: new Date().toISOString(), sources: {} }

// ── 기존 기록 (Playwright 콜백 Date.now, ref 미기록) ──
// 서버가 한 소켓의 접속 요청을 순서대로 응답한다고 가정하지 않기 위해, 빈 토픽 오류 응답마다
// "그 이전에 보낸 빈 토픽 phx_join 중 아직 짝이 없는 가장 오래된 것"과 짝짓고, 짝짓는 방식을 결과에 적는다.
if (legacy) {
  const pairs = []
  for (const trace of legacy.traces) {
    const pending = []
    for (const e of trace.events) {
      if (e.topic !== EMPTY_TOPIC) continue
      if (e.kind === 'send' && e.event === 'phx_join') pending.push(e)
      if (e.kind === 'recv' && e.event === 'phx_reply' && e.detail.startsWith('status=error')) {
        const send = pending.shift()
        if (send) pairs.push({ run: trace.runIndex, sendAt: send.at, replyAt: e.at, ms: e.at - send.at })
      }
    }
  }
  out.sources.legacy = 'realtime-trace.json'
  out.legacy = {
    method: 'Playwright 콜백 Date.now (기존 trace-realtime.mjs). ref가 기록되지 않아 보낸 순서대로 짝지음',
    pairs,
    emptyReplyMs: stats(pairs.map((p) => p.ms)),
  }
}

// ── 실험 1 ──
if (exp1) {
  const browser = exp1.runs.filter((r) => r.method === 'browser' && r.status === 'ok')
  out.sources.exp1 = 'realtime-rootcause-exp1-empty-only.json'
  out.exp1 = {
    emptyReplyMs: exp1.summary,
    sameFrameDiffMs: {
      playwrightMinusCdp: stats(browser.map((r) => r.emptyReplyMs.playwrightCallback - r.emptyReplyMs.cdpProtocol)),
      inPageMinusCdp: stats(browser.map((r) => r.emptyReplyMs.inPage - r.emptyReplyMs.cdpProtocol)),
    },
  }
}

// ── 실험 1b ──
if (exp1b) {
  out.sources.exp1b = 'realtime-rootcause-exp1b-heartbeat-probe.json'
  out.exp1b = exp1b.summary
}

// ── 실험 2 ──
if (exp2) {
  out.sources.exp2 = 'realtime-rootcause-exp2-socket-isolation.json'
  const app = exp2.runs.filter((r) => r.part === 'app')
  const appPairs = app.flatMap((r) => (r.emptyPairs ?? []).map((p, index) => ({ ...p, index, run: r.seq })))
  const complete = appPairs.filter((p) => p.playwrightCallbackMs !== null && p.cdpProtocolMs !== null)
  const raw = exp2.runs.filter((r) => r.part === 'raw' && r.status === 'ok' && r.emptyReplyMs !== null)

  out.exp2 = {
    summary: exp2.summary,
    emptyReplyByMethod: {
      rawNodeClient: stats(raw.map((r) => r.emptyReplyMs)),
      appPlaywrightCallback: stats(complete.map((p) => p.playwrightCallbackMs)),
      appCdpProtocol: stats(complete.map((p) => p.cdpProtocolMs)),
    },
    appSameFrameDiffMs: {
      playwrightMinusCdp: stats(complete.map((p) => p.playwrightCallbackMs - p.cdpProtocolMs)),
    },
    // 앱의 재시도 순번별(0 = 첫 요청) CDP 기준 요청→응답. 앞 요청을 기다린 시간이 섞일 수 있다
    appByRetryIndex: Object.fromEntries(
      [...new Set(complete.map((p) => p.index))]
        .sort((a, b) => a - b)
        .map((index) => [index, stats(complete.filter((p) => p.index === index).map((p) => p.cdpProtocolMs))]),
    ),
    appPairsMissingReply: appPairs.filter((p) => p.cdpProtocolMs === null).length,
  }

  // A·B 조건: 삽입 시점에 빈 토픽이 대기 중이었던 회차만 따로 본다
  const byPending = (condition, pending) =>
    stats(
      raw
        .filter((r) => r.condition === condition && r.emptyPendingAtInsertStart === pending)
        .map((r) => r.changeAfterInsertStartMs),
    )
  out.exp2.rawChangeAfterInsertStartByPending = {
    A_pending: byPending('A', true),
    A_notPending: byPending('A', false),
    B_pending: byPending('B', true),
    B_notPending: byPending('B', false),
    C: stats(exp2.runs.filter((r) => r.part === 'raw' && r.status === 'ok' && r.condition === 'C').map((r) => r.changeAfterInsertStartMs)),
  }
  // A 조건에서 메시지 프레임이 빈 토픽 오류 응답 몇 ms 뒤에 왔는가 (대기 중이었던 회차)
  out.exp2.rawAChangeMinusEmptyReplyWhenPending = stats(
    raw.filter((r) => r.condition === 'A' && r.emptyPendingAtInsertEnd === true).map((r) => r.changeMinusEmptyReplyMs),
  )
}

const path = saveJson('realtime-rootcause-exp3-clock-crosscheck', out)
console.log(JSON.stringify(out, (key, value) => (key === 'pairs' || key === 'summary' ? undefined : value), 2))
console.log(`저장: ${path}`)
