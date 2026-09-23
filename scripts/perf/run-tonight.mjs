/**
 * 항목별 기여도 측정 일괄 실행
 *
 * 저녁에 이 명령 하나만 실행하면 된다. 서버 기동부터 운영 데이터 정리까지
 * 한 번에 처리하고, 중간에 실패해도 정리와 서버 종료는 반드시 수행한다.
 *
 *   1. 조건별 서버 8개 기동 및 응답 확인
 *   2. 운영 테스트 계정 2개 + 엔빵 그룹 생성 (알림 무해화 포함)
 *   3. 메시지 100건 시딩
 *   4. 8조건 x 20회 측정 (조건 순서 회전)
 *   5. 분석표 생성
 *   6. 운영 데이터 전량 삭제 및 잔존 0건 검증
 *   7. 서버 종료
 *
 * 실행: node scripts/perf/run-tonight.mjs [--pilot]
 */

import { createClient } from '@supabase/supabase-js'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { COMPILER_CONDITIONS, CONDITIONS } from './conditions.mjs'

/** --set compiler 를 주면 React Compiler 비교 실험 조건을 쓴다 */
const setIndex = process.argv.indexOf('--set')
const isCompilerSet = setIndex !== -1 && process.argv[setIndex + 1] === 'compiler'
const ACTIVE_CONDITIONS = isCompilerSet ? COMPILER_CONDITIONS : CONDITIONS

const ROOT = process.cwd()
const SCRATCH = process.env.PERF_SCRATCH ?? 'C:/Users/user/AppData/Local/Temp/pf'
const SETUP_JSON = join(SCRATCH, 'setup.json')
const EXPECTED_PROJECT_REF = 'yyisakaqnaoomehqlyjz'
const TEST_EMAIL_PREFIX = 'nbread-perf-test-'
const SEED_COUNT = 100
const SERVER_READY_TIMEOUT_MS = 120_000

const isPilot = process.argv.includes('--pilot')
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
const outDir = isCompilerSet
  ? join(ROOT, 'docs/performance/results', stamp, 'compiler')
  : join(ROOT, 'docs/performance/results', stamp)

const log = (message) => console.log(`\n[${new Date().toLocaleTimeString('ko-KR')}] ${message}`)

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

const node = (args, options = {}) => {
  const result = spawnSync(process.execPath, args, {
    stdio: 'inherit',
    cwd: ROOT,
    ...options,
  })
  if (result.status !== 0) {
    throw new Error(`실패: node ${args.join(' ')}`)
  }
}

const conditionDir = (condition) =>
  condition.axes === null ? ROOT : join(SCRATCH, condition.key)

const servers = []

const startServers = async () => {
  for (const condition of ACTIVE_CONDITIONS) {
    const cwd = conditionDir(condition)

    if (!existsSync(join(cwd, '.next', 'BUILD_ID'))) {
      throw new Error(`${condition.key} 빌드가 없습니다: ${cwd}`)
    }

    const child = spawn(process.execPath, ['./node_modules/next/dist/bin/next', 'start'], {
      cwd,
      env: { ...process.env, PORT: String(condition.port), NODE_ENV: 'production' },
      stdio: 'ignore',
      detached: false,
    })
    servers.push({ condition, child })
  }

  log(`서버 ${servers.length}개 기동 중, 응답 대기`)

  for (const { condition } of servers) {
    const deadline = Date.now() + SERVER_READY_TIMEOUT_MS
    let ready = false
    while (!ready && Date.now() < deadline) {
      try {
        const response = await fetch(`http://127.0.0.1:${condition.port}/login`)
        ready = response.status < 500
      } catch {
        // 아직 기동 중
      }
      if (!ready) {
        await new Promise((r) => setTimeout(r, 1000))
      }
    }
    if (!ready) {
      throw new Error(`${condition.key} (:${condition.port}) 서버가 응답하지 않습니다`)
    }
    console.log(`  ${condition.key.padEnd(10)} :${condition.port} 준비됨`)
  }
}

const stopServers = () => {
  for (const { condition, child } of servers) {
    try {
      child.kill()
    } catch {
      // 이미 종료된 경우는 무시
    }
    void condition
  }
  log('서버 종료 완료')
}

/**
 * 정리 스크립트가 놓치는 잔여물을 마저 지운다.
 *
 * `cleanup-test-accounts.mjs`는 setup JSON에 적힌 자원만 지우므로, 계정 생성이
 * 중간에 실패했거나 정리를 건너뛴 회차의 잔여물이 운영에 남는다. 실제로
 * 2026-09-02 실험의 계정과 엔빵 그룹이 20일간 남아 있었다.
 */
const sweepOrphans = async () => {
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) {
    console.error(`고아 계정 확인 실패: ${error.message}`)
  } else {
    const orphans = data.users.filter((user) => (user.email ?? '').startsWith(TEST_EMAIL_PREFIX))
    for (const orphan of orphans) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(orphan.id)
      console.log(
        `  고아 계정 삭제 ${orphan.email}: ${deleteError ? `실패 (${deleteError.message})` : '완료'}`,
      )
    }
    console.log(orphans.length === 0 ? '  고아 계정 없음' : `  고아 계정 ${orphans.length}건 처리`)
  }

  const { data: nbreads, error: nbreadError } = await admin.from('nbread').select('id, title')
  if (nbreadError) {
    console.error(`고아 엔빵 확인 실패: ${nbreadError.message}`)
    return
  }

  const orphanNbreads = (nbreads ?? []).filter((row) => (row.title ?? '').startsWith('[PERF]'))
  for (const row of orphanNbreads) {
    await admin.from('chat_messages').delete().eq('nbread_id', row.id)
    await admin.from('participant').delete().eq('nbread_id', row.id)
    const { error: deleteError } = await admin.from('nbread').delete().eq('id', row.id)
    console.log(
      `  고아 엔빵 삭제 ${row.id}: ${deleteError ? `실패 (${deleteError.message})` : '완료'}`,
    )
  }
  console.log(orphanNbreads.length === 0 ? '  고아 엔빵 없음' : `  고아 엔빵 ${orphanNbreads.length}건 처리`)
}

const main = async () => {
  mkdirSync(outDir, { recursive: true })

  await startServers()

  log('운영 테스트 계정 생성 (알림 무해화 포함)')
  if (existsSync(SETUP_JSON)) rmSync(SETUP_JSON)
  node(['scripts/perf/setup-test-accounts.mjs', '--out', SETUP_JSON])

  log(`메시지 ${SEED_COUNT}건 시딩`)
  node(['scripts/perf/seed-messages.mjs', SETUP_JSON, '--count', String(SEED_COUNT)])

  if (isCompilerSet) {
    // 컴파일러가 실제로 적용됐는지 먼저 확인한다. 적용 안 된 상태로 측정하면
    // "효과가 없었다"와 "적용조차 안 됐다"를 구분할 수 없다
    log('React Compiler 적용 검증')
    node(['scripts/perf/verify-compiler.mjs'])
  }

  log('측정 시작. 이 시점부터 노트북을 건드리지 않아야 한다')
  node([
    'scripts/perf/run-contribution.mjs',
    SETUP_JSON,
    '--out',
    outDir,
    ...(isCompilerSet ? ['--set', 'compiler'] : []),
    ...(isPilot ? ['--pilot'] : []),
  ])

  log('분석')
  node(['scripts/perf/analyze-contribution.mjs', join(outDir, 'contribution-raw.json')])
}

const cleanup = async () => {
  try {
    if (existsSync(SETUP_JSON)) {
      log('운영 테스트 데이터 정리')
      node(['scripts/perf/cleanup-test-accounts.mjs', SETUP_JSON])
    }
    await sweepOrphans()
  } catch (error) {
    console.error(`정리 중 오류: ${error.message}`)
    console.error('운영 DB에 데이터가 남았을 수 있다. 수동 확인이 필요하다.')
  } finally {
    stopServers()
  }
}

main()
  .then(async () => {
    await cleanup()
    log(`끝. 결과: ${outDir}`)
  })
  .catch(async (error) => {
    console.error(`\n실패: ${error.message}`)
    await cleanup()
    process.exit(1)
  })
