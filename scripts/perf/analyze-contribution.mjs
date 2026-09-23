/**
 * 항목별 기여도 분석
 *
 * 조건별 중앙값과 사분위 범위를 내고, 개선 전 대비 감소량을 축의 몫으로 귀속한다.
 * A와 C는 서로 겹치므로(메모가 렌더를 막으면 시간 포맷을 미리 계산한 이득이 사라진다)
 * 두 축의 단독 효과 합과 A+C 동시 적용의 차이를 중첩분으로 따로 보고한다.
 *
 * 실행: node scripts/perf/analyze-contribution.mjs <contribution-raw.json>
 */

import { readFileSync, writeFileSync } from 'node:fs'

const METRICS = [
  { key: 'keydownToPaint', label: '체감 지연 (Enter→페인트)', unit: 'ms' },
  { key: 'actualDurationSum', label: '렌더 비용 합', unit: 'ms' },
  { key: 'commitCount', label: '커밋 수', unit: '회' },
  { key: 'longTaskSum', label: 'Long Task 합', unit: 'ms' },
]

const quantile = (sorted, fraction) => {
  if (sorted.length === 0) return null
  const position = (sorted.length - 1) * fraction
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
}

const summarize = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return {
    n: sorted.length,
    median: quantile(sorted, 0.5),
    q1: quantile(sorted, 0.25),
    q3: quantile(sorted, 0.75),
    p95: quantile(sorted, 0.95),
  }
}

/** Mann-Whitney U, 정규근사 + 동점 보정 */
const mannWhitney = (a, b) => {
  if (a.length === 0 || b.length === 0) return { p: null, effectSize: null }

  const combined = [...a.map((v) => ({ v, g: 0 })), ...b.map((v) => ({ v, g: 1 }))].sort(
    (x, y) => x.v - y.v,
  )

  const ranks = new Array(combined.length)
  const tieGroups = []
  let index = 0
  while (index < combined.length) {
    let end = index
    while (end + 1 < combined.length && combined[end + 1].v === combined[index].v) end += 1
    const rank = (index + end) / 2 + 1
    for (let k = index; k <= end; k += 1) ranks[k] = rank
    if (end > index) tieGroups.push(end - index + 1)
    index = end + 1
  }

  let rankSumA = 0
  combined.forEach((entry, position) => {
    if (entry.g === 0) rankSumA += ranks[position]
  })

  const n1 = a.length
  const n2 = b.length
  const u1 = rankSumA - (n1 * (n1 + 1)) / 2
  const u = Math.min(u1, n1 * n2 - u1)
  const mean = (n1 * n2) / 2
  const n = n1 + n2
  const tieCorrection = tieGroups.reduce((sum, size) => sum + (size ** 3 - size), 0)
  const variance = ((n1 * n2) / 12) * (n + 1 - tieCorrection / (n * (n - 1)))
  if (variance <= 0) return { p: null, effectSize: null }

  const z = (u - mean) / Math.sqrt(variance)
  // 표준정규 양측 p값 (Abramowitz-Stegun 근사)
  const absZ = Math.abs(z)
  const t = 1 / (1 + 0.2316419 * absZ)
  const density = Math.exp(-(absZ ** 2) / 2) / Math.sqrt(2 * Math.PI)
  const tail =
    density *
    (0.319381530 * t -
      0.356563782 * t ** 2 +
      1.781477937 * t ** 3 -
      1.821255978 * t ** 4 +
      1.330274429 * t ** 5)

  return {
    p: 2 * tail,
    effectSize: Math.abs((2 * u1) / (n1 * n2) - 1),
  }
}

const path = process.argv[2]
if (!path) {
  throw new Error('사용법: node scripts/perf/analyze-contribution.mjs <contribution-raw.json>')
}

const data = JSON.parse(readFileSync(path, 'utf8'))
const byCondition = new Map()
for (const row of data.results) {
  if (!byCondition.has(row.condition)) byCondition.set(row.condition, [])
  byCondition.get(row.condition).push(row)
}

const order = data.conditions.map((condition) => condition.key)
const baseline = 'P0_before'
const labelOf = (key) => data.conditions.find((c) => c.key === key)?.label ?? key

const analysis = {}
for (const metric of METRICS) {
  const perCondition = {}
  const baseValues = (byCondition.get(baseline) ?? []).map((row) => row[metric.key])

  for (const key of order) {
    const values = (byCondition.get(key) ?? []).map((row) => row[metric.key])
    const stats = summarize(values)
    const test = key === baseline ? { p: null, effectSize: null } : mannWhitney(baseValues, values)

    perCondition[key] = {
      ...stats,
      delta: stats.median === null ? null : stats.median - (summarize(baseValues).median ?? 0),
      ...test,
    }
  }
  analysis[metric.key] = perCondition
}

/** A와 C의 중첩분: 단독 효과의 합에서 동시 적용 효과를 뺀 값 */
const overlap = {}
for (const metric of ['keydownToPaint', 'actualDurationSum']) {
  const get = (key) => analysis[metric][key]?.delta
  const a = get('P2_A')
  const c = get('P1_C')
  const ac = get('P3_AC')
  // 감소량을 양수로 뒤집어 보고한다. 부호가 섞이면 표가 읽히지 않는다
  overlap[metric] =
    a === null || c === null || ac === null || a === undefined
      ? null
      : { aAlone: -a, cAlone: -c, together: -ac, overlap: -a + -c - -ac }
}

const fixed = (value, digits = 1) => (value === null || value === undefined ? '-' : value.toFixed(digits))

const lines = []
lines.push('# 항목별 기여도 분석')
lines.push('')
lines.push(`- 측정 일시: ${data.measuredAt}`)
lines.push(`- 시나리오: 전송, 메시지 ${data.size}건, CPU ${data.cpuThrottleRate}배 제한`)
lines.push(`- 조건당 ${data.measuredRuns}회 (워밍업 ${data.warmupRuns}회 폐기)`)
lines.push(`- 실패: ${data.failures.length}건`)
lines.push('')

for (const metric of METRICS) {
  lines.push(`## ${metric.label}`)
  lines.push('')
  lines.push('| 조건 | 설명 | n | 중앙값 | IQR | 개선 전 대비 | p | 효과 크기 |')
  lines.push('|---|---|---|---|---|---|---|---|')
  for (const key of order) {
    const stats = analysis[metric.key][key]
    const delta = key === baseline ? '기준' : `${stats.delta > 0 ? '+' : ''}${fixed(stats.delta)}`
    lines.push(
      `| ${key} | ${labelOf(key)} | ${stats.n} | **${fixed(stats.median)}** | ${fixed(stats.q1)}~${fixed(stats.q3)} | ${delta} | ${stats.p === null ? '-' : stats.p < 0.001 ? '<0.001' : fixed(stats.p, 3)} | ${fixed(stats.effectSize, 2)} |`,
    )
  }
  lines.push('')
}

lines.push('## A와 C의 중첩')
lines.push('')
lines.push(
  '모두 감소량(양수)이다. 중첩분이 0보다 크면 그만큼 두 축이 같은 비용을 줄인 것이므로, 항목별 감소량을 더해 전체와 맞추면 안 된다.',
)
lines.push('')
lines.push('| 지표 | A 단독 감소 | C 단독 감소 | A+C 동시 감소 | 중첩분 |')
lines.push('|---|---|---|---|---|')
for (const [metric, value] of Object.entries(overlap)) {
  if (!value) continue
  lines.push(
    `| ${metric} | ${fixed(value.aAlone)} | ${fixed(value.cAlone)} | ${fixed(value.together)} | ${fixed(value.overlap)} |`,
  )
}
lines.push('')

if (data.failures.length > 0) {
  lines.push('## 실패')
  lines.push('')
  for (const failure of data.failures) {
    lines.push(`- ${failure.condition} run ${failure.run} 시도 ${failure.attempt}: ${failure.message}`)
  }
  lines.push('')
}

const markdownPath = path.replace(/\.json$/, '-analysis.md')
const jsonPath = path.replace(/\.json$/, '-analysis.json')
writeFileSync(markdownPath, lines.join('\n'))
writeFileSync(jsonPath, JSON.stringify({ analysis, overlap }, null, 2))

console.log(lines.join('\n'))
console.log(`\n저장: ${markdownPath}`)
