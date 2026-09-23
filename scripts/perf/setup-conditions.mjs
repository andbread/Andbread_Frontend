/**
 * 항목별 기여도 측정용 조건 빌드 준비
 *
 * 조건마다 워크트리를 만들고, PR #144을 역적용해 개선 전 코드로 되돌린 뒤,
 * 축 하나만 다시 적용하고 `next build --profile`로 빌드한다.
 *
 * 계측(PerfProfiler)은 PR #144이 건드리지 않은 파일에만 들어가므로
 * 모든 조건에 바이트 단위로 동일하게 복사한다.
 *
 * 실행: node scripts/perf/setup-conditions.mjs [--only P1_C,P2_A] [--skip-build]
 */

import { execFileSync, execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { COMPILER_CONDITIONS, CONDITIONS } from './conditions.mjs'

const ROOT = process.cwd()
const SCRATCH = process.env.PERF_SCRATCH ?? resolve(ROOT, '../.perf-conditions')
const REVERSE_PATCH = resolve(ROOT, 'docs/performance/pr144-reverse.patch')

/** 양쪽 빌드에 동일하게 들어가야 하는 계측 파일 */
const INSTRUMENTATION = [
  'src/components/perf/PerfProfiler.tsx',
  'src/app/nbread/[nbreadId]/page.tsx',
]

const ENV_FILES = ['.env', '.env.local', '.env.production.local']

const onlyIndex = process.argv.indexOf('--only')
const only =
  onlyIndex === -1 ? null : process.argv[onlyIndex + 1].split(',').map((key) => key.trim())
const skipBuild = process.argv.includes('--skip-build')

/** --set compiler 를 주면 React Compiler 비교 실험 조건을 쓴다 */
const setIndex = process.argv.indexOf('--set')
const conditionSet =
  setIndex !== -1 && process.argv[setIndex + 1] === 'compiler' ? COMPILER_CONDITIONS : CONDITIONS

const run = (command, options = {}) =>
  execSync(command, { stdio: 'inherit', cwd: ROOT, ...options })

/**
 * 문자열 치환. 대상이 없으면 즉시 실패시킨다.
 *
 * 저장소 파일은 CRLF이고 치환 정의는 LF이므로, LF로 정규화해 비교한 뒤
 * 원래 줄바꿈 방식으로 되돌려 쓴다.
 */
const applyEdits = (path, edits, conditionKey) => {
  const original = readFileSync(path, 'utf8')
  const usesCrlf = original.includes('\r\n')
  let next = original.split('\r\n').join('\n')

  for (const { from, to } of edits) {
    if (!next.includes(from)) {
      throw new Error(
        `[${conditionKey}] ${path}에서 치환 대상을 찾지 못했습니다:\n---\n${from.slice(0, 200)}\n---`,
      )
    }
    next = next.replace(from, to)
  }

  writeFileSync(path, usesCrlf ? next.split('\n').join('\r\n') : next)
}

/** 새로 만드는 파일도 저장소와 같은 줄바꿈 방식으로 쓴다 */
const writeSource = (path, source, usesCrlf) => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, usesCrlf ? source.split('\n').join('\r\n') : source)
}

const prepare = async (condition) => {
  const target = join(SCRATCH, condition.key)
  console.log(`\n=== ${condition.key} (${condition.label}) → ${target}`)

  if (existsSync(target)) {
    // node_modules 정션을 먼저 떼어낸다. 붙어 있으면 워크트리 삭제가 실패하고,
    // 재귀 삭제가 원본 node_modules를 건드릴 위험도 생긴다
    const link = join(target, 'node_modules')
    if (existsSync(link)) {
      run(`cmd /c rmdir "${link}"`, { stdio: 'pipe' })
    }

    try {
      run(`git worktree remove "${target}" --force`, { stdio: 'pipe' })
    } catch {
      rmSync(target, { recursive: true, force: true, maxRetries: 3 })
    }

    if (existsSync(target)) {
      throw new Error(`기존 디렉터리를 지우지 못했습니다: ${target}`)
    }
  }
  run('git worktree prune', { stdio: 'pipe' })

  run(`git worktree add --detach "${target}" HEAD`)

  // 개선 전 코드로 되돌린다
  execFileSync('git', ['apply', '-R', REVERSE_PATCH], { cwd: target, stdio: 'inherit' })

  const usesCrlf = readFileSync(join(target, 'src/components/chat/ChatRoom.tsx'), 'utf8').includes(
    '\r\n',
  )

  // 축을 하나만 다시 적용한다
  for (const axis of condition.axes) {
    for (const [relativePath, source] of Object.entries(axis.write)) {
      writeSource(join(target, relativePath), source, usesCrlf)
    }
    for (const [relativePath, edits] of Object.entries(axis.edit)) {
      applyEdits(join(target, relativePath), edits, condition.key)
    }
  }

  // 계측과 환경 변수를 동일하게 복사한다
  for (const relativePath of INSTRUMENTATION) {
    const full = join(target, relativePath)
    mkdirSync(dirname(full), { recursive: true })
    copyFileSync(join(ROOT, relativePath), full)
  }
  for (const name of ENV_FILES) {
    if (existsSync(join(ROOT, name))) {
      copyFileSync(join(ROOT, name), join(target, name))
    }
  }

  // node_modules는 정션으로 공유한다 (의존성 동일 보장 + 설치 시간 절약)
  if (!existsSync(join(target, 'node_modules'))) {
    run(`cmd /c mklink /J "${join(target, 'node_modules')}" "${join(ROOT, 'node_modules')}"`, {
      stdio: 'pipe',
    })
  }

  if (skipBuild) {
    console.log(`[${condition.key}] 빌드 건너뜀`)
    return
  }

  console.log(`[${condition.key}] 빌드 시작`)
  run('node ./node_modules/next/dist/bin/next build --profile', {
    cwd: target,
    env: { ...process.env, SENTRY_AUTH_TOKEN: '', NEXT_TELEMETRY_DISABLED: '1' },
  })
  console.log(`[${condition.key}] 빌드 완료`)
}

const main = async () => {
  if (!existsSync(REVERSE_PATCH)) {
    throw new Error(`역적용 패치를 찾을 수 없습니다: ${REVERSE_PATCH}`)
  }

  mkdirSync(SCRATCH, { recursive: true })

  // reuse 표시가 붙은 조건은 이미 빌드된 워크트리를 그대로 쓴다
  const targets = conditionSet.filter(
    (condition) =>
      condition.axes !== null &&
      !condition.reuse &&
      (!only || only.includes(condition.key)),
  )

  for (const condition of targets) {
    await prepare(condition)
  }

  console.log('\n준비 완료')
  for (const condition of conditionSet) {
    const where = condition.axes === null ? ROOT : join(SCRATCH, condition.key)
    console.log(`  ${condition.key.padEnd(10)} :${condition.port}  ${where}`)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
