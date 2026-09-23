/**
 * 측정 원시 데이터 통계 처리.
 *
 * 셀(시나리오 x 규모 x 네트워크) 단위로 Before/After를 비교한다.
 * 평균/표준편차 대신 중앙값 중심으로 보고하고, 정규성을 가정하지 않는
 * Mann-Whitney U 검정과 rank-biserial 효과 크기를 함께 낸다.
 *
 * 실행: node scripts/perf/analyze.mjs <raw.json> [--metric actualDurationSum]
 */

import { readFileSync, writeFileSync } from 'node:fs'

const METRICS = [
  'actualDurationSum',
  'actualDurationMax',
  'commitCount',
  'actualOverBase',
  'keydownToPaint',
  'receiveToPaintApprox',
  'wallClock',
  'longTaskTotal',
]

const quantile = (sorted, q) => {
  if (sorted.length === 0) return null
  const position = (sorted.length - 1) * q
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
}

const describe = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return {
    n: sorted.length,
    median: quantile(sorted, 0.5),
    q1: quantile(sorted, 0.25),
    q3: quantile(sorted, 0.75),
    p95: quantile(sorted, 0.95),
    min: sorted[0] ?? null,
    max: sorted[sorted.length - 1] ?? null,
  }
}

/** 정규 분포 누적 함수 (Abramowitz-Stegun 근사) */
const normalCdf = (z) => {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2)
  const probability =
    d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return z > 0 ? 1 - probability : probability
}

/**
 * Mann-Whitney U 검정 (동순위 보정 포함 정규 근사).
 * 표본이 20 내외라 정규 근사가 유효한 범위다.
 */
const mannWhitneyU = (a, b) => {
  const combined = [
    ...a.map((value) => ({ value, group: 'a' })),
    ...b.map((value) => ({ value, group: 'b' })),
  ].sort((left, right) => left.value - right.value)

  const ranks = new Array(combined.length)
  const tieGroups = []

  let index = 0
  while (index < combined.length) {
    let end = index
    while (end + 1 < combined.length && combined[end + 1].value === combined[index].value) {
      end += 1
    }
    const averageRank = (index + end + 2) / 2
    for (let position = index; position <= end; position += 1) {
      ranks[position] = averageRank
    }
    if (end > index) tieGroups.push(end - index + 1)
    index = end + 1
  }

  const rankSumA = combined.reduce(
    (sum, entry, position) => (entry.group === 'a' ? sum + ranks[position] : sum),
    0,
  )

  const n1 = a.length
  const n2 = b.length
  const u1 = rankSumA - (n1 * (n1 + 1)) / 2
  const u2 = n1 * n2 - u1
  const u = Math.min(u1, u2)

  const mean = (n1 * n2) / 2
  const total = n1 + n2
  const tieCorrection = tieGroups.reduce((sum, size) => sum + (size ** 3 - size), 0)
  const variance =
    ((n1 * n2) / 12) * (total + 1 - tieCorrection / (total * (total - 1)))

  if (variance <= 0) {
    return { u, p: 1, rankBiserial: 0 }
  }

  const z = (u - mean + 0.5) / Math.sqrt(variance)
  const p = 2 * normalCdf(-Math.abs(z))

  // rank-biserial: 1에 가까울수록 두 분포가 완전히 분리된다
  const rankBiserial = 1 - (2 * u) / (n1 * n2)

  return { u, z, p: Math.min(1, p), rankBiserial }
}

const rawPath = process.argv[2]
if (!rawPath) {
  throw new Error('사용법: node scripts/perf/analyze.mjs <raw.json>')
}

const raw = JSON.parse(readFileSync(rawPath, 'utf8'))

const cellKey = (row) => `${row.scenario}/${row.size}/${row.network}`
const cells = new Map()

for (const row of raw.results) {
  const key = cellKey(row)
  if (!cells.has(key)) {
    cells.set(key, { before: [], after: [] })
  }
  cells.get(key)[row.condition].push(row)
}

const report = []

for (const [key, groups] of cells) {
  for (const metric of METRICS) {
    const before = groups.before
      .map((row) => row[metric])
      .filter((value) => typeof value === 'number' && Number.isFinite(value))
    const after = groups.after
      .map((row) => row[metric])
      .filter((value) => typeof value === 'number' && Number.isFinite(value))

    if (before.length === 0 || after.length === 0) continue

    const beforeStats = describe(before)
    const afterStats = describe(after)
    const test = mannWhitneyU(before, after)

    report.push({
      cell: key,
      metric,
      before: beforeStats,
      after: afterStats,
      improvement:
        beforeStats.median === 0 ? null : 1 - afterStats.median / beforeStats.median,
      p: test.p,
      rankBiserial: test.rankBiserial,
      significant: test.p < 0.05,
    })
  }
}

const formatNumber = (value) =>
  value === null || value === undefined ? '-' : Number(value).toFixed(2)

const lines = [
  '| 셀 | 지표 | Before 중앙값 (IQR) | After 중앙값 (IQR) | 개선율 | p | 효과크기 |',
  '|---|---|---|---|---|---|---|',
]

for (const row of report) {
  lines.push(
    `| ${row.cell} | ${row.metric} | ${formatNumber(row.before.median)} (${formatNumber(row.before.q1)}~${formatNumber(row.before.q3)}) | ${formatNumber(row.after.median)} (${formatNumber(row.after.q1)}~${formatNumber(row.after.q3)}) | ${row.improvement === null ? '-' : `${(row.improvement * 100).toFixed(1)}%`} | ${row.p < 0.001 ? '<0.001' : row.p.toFixed(3)} | ${formatNumber(row.rankBiserial)} |`,
  )
}

const markdown = lines.join('\n')
const outPath = rawPath.replace(/\.json$/, '-analysis.md')
writeFileSync(outPath, `${markdown}\n`)
writeFileSync(rawPath.replace(/\.json$/, '-analysis.json'), JSON.stringify(report, null, 2))

console.log(markdown)
console.log(`\n분석 결과: ${outPath}`)
