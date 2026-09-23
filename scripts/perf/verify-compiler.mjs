/**
 * React Compiler가 채팅 화면에 실제로 적용됐는지 빌드 산출물에서 확인한다.
 *
 * 컴파일러는 React 규칙에서 벗어난 코드를 만나면 해당 컴포넌트를 조용히
 * 건너뛴다. 개선 전 코드는 `useEffect`에 async 함수를 넘기는 등 문제가 있어
 * 건너뛸 가능성이 있다. 그 경우 측정 결과는 "컴파일러가 효과 없었다"가 아니라
 * "컴파일러가 적용조차 안 됐다"로 읽어야 하므로, 측정 전에 구분해야 한다.
 *
 * 판별 근거는 `react.memo_cache_sentinel` 문자열이다. 컴파일러가 만든
 * 메모이제이션 캐시가 이 심벌로 빈 칸을 표시하며, 문자열이라 최소화(minify)
 * 후에도 남는다. 컴파일러를 끈 빌드의 채팅 청크에는 이 문자열이 없다.
 *
 * 채팅 청크는 입력창 placeholder 문구로 찾는다. 앱 전체가 아니라 이 화면에
 * 적용됐는지를 봐야 하기 때문이다.
 *
 * 실행: node scripts/perf/verify-compiler.mjs
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'

const SCRATCH = process.env.PERF_SCRATCH ?? 'C:/Users/user/AppData/Local/Temp/pf'
const CHAT_NEEDLE = '메세지를 입력하세요'
const COMPILER_MARKER = 'memo_cache_sentinel'

const PAIRS = [
  { on: 'K1_compiler', off: 'P0_before', label: '개선 전 원본' },
  { on: 'K2_split_compiler', off: 'P2_A', label: '분리된 컴포넌트' },
]

const walk = (dir) => {
  const out = []
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walk(full))
    } else if (entry.name.endsWith('.js')) {
      out.push(full)
    }
  }
  return out
}

/** 채팅 화면이 들어 있는 클라이언트 청크를 찾아 컴파일러 흔적을 센다 */
const scanChatChunk = (conditionKey) => {
  const root = join(SCRATCH, conditionKey, '.next')
  const chunks = walk(root).filter((file) => readFileSync(file, 'utf8').includes(CHAT_NEEDLE))

  let markerCount = 0
  let bytes = 0
  const names = []

  for (const file of chunks) {
    const content = readFileSync(file, 'utf8')
    const hits = (content.match(new RegExp(COMPILER_MARKER, 'g')) ?? []).length
    if (hits > 0) {
      markerCount += hits
      names.push(basename(file))
    }
    bytes += statSync(file).size
  }

  return { chunkCount: chunks.length, bytes, markerCount, names }
}

console.log('React Compiler 적용 검증\n')

let allApplied = true

for (const pair of PAIRS) {
  const on = scanChatChunk(pair.on)
  const off = scanChatChunk(pair.off)

  const applied = on.markerCount > 0 && off.markerCount === 0
  if (!applied) allApplied = false

  const delta = on.bytes - off.bytes
  const deltaPercent = ((delta / off.bytes) * 100).toFixed(1)

  console.log(`## ${pair.label}`)
  console.log(
    `  켬  ${pair.on.padEnd(18)} 캐시 표식 ${String(on.markerCount).padStart(3)}회  채팅 청크 ${on.bytes}바이트`,
  )
  console.log(
    `  끔  ${pair.off.padEnd(18)} 캐시 표식 ${String(off.markerCount).padStart(3)}회  채팅 청크 ${off.bytes}바이트`,
  )
  console.log(`  청크 크기 차이: ${delta > 0 ? '+' : ''}${delta}바이트 (${deltaPercent}%)`)
  console.log(`  판정: ${applied ? '적용됨' : '적용 안 됨'}`)
  console.log()
}

if (!allApplied) {
  console.log('경고: 컴파일러가 채팅 화면에 적용되지 않았다. 이 상태로 측정하면')
  console.log('      "컴파일러가 효과 없었다"와 "컴파일러가 안 돌았다"를 구분할 수 없다.')
  process.exit(1)
}

console.log('두 조건 모두 채팅 화면에 컴파일러가 적용됐다. 측정을 진행해도 된다.')
