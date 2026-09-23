/**
 * 채팅 성능 검증용 테스트 계정 및 엔빵 그룹 생성 스크립트
 *
 * - Supabase Auth Admin API로 email/password 계정 2개 생성
 *   (서비스는 소셜 로그인만 제공하므로 UI 로그인은 불가능하다.
 *    측정 스크립트는 세션을 localStorage에 직접 주입해 사용한다.)
 * - auth.users INSERT 트리거(insert_into_public_users)는 provider가
 *   kakao/google일 때만 public.user 행을 만든다. email provider는 해당하지
 *   않으므로 public.user 행을 직접 넣는다.
 * - 알림 무해화: user_notification_settings에서 알림 전부 off, fcm_token 제거
 *
 * 실행: node scripts/perf/setup-test-accounts.mjs
 * 결과: 계정 정보를 stdout과 --out 경로에 JSON으로 출력
 */

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const EXPECTED_PROJECT_REF = 'yyisakaqnaoomehqlyjz' // 운영
const ENV_FILE = '.env' // .env.local은 개발 프로젝트를 가리키므로 쓰지 않는다
const TERMS_VERSION = '2026-05-26'
const PRIVACY_VERSION = '2026-05-26'

const parseEnv = (path) =>
  Object.fromEntries(
    readFileSync(path, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=')
        const key = line.slice(0, index).trim()
        const value = line
          .slice(index + 1)
          .trim()
          .replace(/^['"]|['"]$/g, '')
        return [key, value]
      }),
  )

const env = parseEnv(ENV_FILE)
const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  throw new Error(`${ENV_FILE}에 SUPABASE URL 또는 SERVICE_ROLE_KEY가 없습니다`)
}

if (!url.includes(EXPECTED_PROJECT_REF)) {
  throw new Error(
    `운영 프로젝트(${EXPECTED_PROJECT_REF})가 아닙니다. 실제: ${url}`,
  )
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ACCOUNTS = [
  { key: 'A', email: 'nbread-perf-test-a@example.com', name: '[PERF] 측정계정A' },
  { key: 'B', email: 'nbread-perf-test-b@example.com', name: '[PERF] 측정계정B' },
]

const createAccount = async ({ key, email, name }) => {
  const password = randomBytes(18).toString('base64url')

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, perf_test: true },
  })

  if (error) {
    throw new Error(`[${key}] auth 계정 생성 실패: ${error.message}`)
  }

  const userId = data.user.id

  // public.user 행 직접 생성 (email provider는 동기화 트리거 대상이 아님)
  // tag에 unique 제약이 있어 기존 사용자와 충돌할 수 있으므로 재시도한다
  let userError = null
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { error } = await admin.from('user').insert({
      id: userId,
      email,
      name,
      social_type: 'google', // User 타입이 'kakao' | 'google'만 허용
      profile_image: null,
      tag: String(Math.floor(Math.random() * 9000 + 1000)),
      terms_agreed: true,
      terms_agreed_at: new Date().toISOString(),
      terms_version: TERMS_VERSION,
      privacy_agreed: true,
      privacy_agreed_at: new Date().toISOString(),
      privacy_version: PRIVACY_VERSION,
    })

    userError = error
    if (!error) break
    if (!error.message.includes('user_tag_key')) break
  }

  if (userError) {
    throw new Error(`[${key}] public.user 생성 실패: ${userError.message}`)
  }

  // 알림 무해화: 전 항목 off
  const { error: settingsError } = await admin
    .from('user_notification_settings')
    .upsert({
      user_id: userId,
      all_enabled: false,
      chat_enabled: false,
      invite_enabled: false,
      friend_enabled: false,
      payment_enabled: false,
    })

  if (settingsError) {
    throw new Error(`[${key}] 알림 설정 실패: ${settingsError.message}`)
  }

  // fcm_token 잔존분 제거 (신규 계정이므로 보통 0건)
  await admin.from('fcm_token').delete().eq('user_id', userId)

  return { key, email, password, userId, name }
}

const main = async () => {
  const accounts = []
  for (const account of ACCOUNTS) {
    accounts.push(await createAccount(account))
  }

  const [leader, member] = accounts

  const { data: nbread, error: nbreadError } = await admin
    .from('nbread')
    .insert({
      title: '[PERF] 채팅 렌더링 성능 측정',
      participant_count: 2,
      amount: 10000,
      payment_date: 1,
      payment_period: 'month',
      leader_id: leader.userId,
    })
    .select('id')
    .single()

  if (nbreadError) {
    throw new Error(`엔빵 그룹 생성 실패: ${nbreadError.message}`)
  }

  const { error: participantError } = await admin.from('participant').insert([
    { nbread_id: nbread.id, user_id: leader.userId, is_leader: true },
    { nbread_id: nbread.id, user_id: member.userId, is_leader: false },
  ])

  if (participantError) {
    throw new Error(`참여자 등록 실패: ${participantError.message}`)
  }

  const result = {
    createdAt: new Date().toISOString(),
    projectRef: EXPECTED_PROJECT_REF,
    nbreadId: nbread.id,
    accounts,
  }

  const outIndex = process.argv.indexOf('--out')
  if (outIndex !== -1 && process.argv[outIndex + 1]) {
    writeFileSync(process.argv[outIndex + 1], JSON.stringify(result, null, 2))
  }

  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
