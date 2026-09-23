/**
 * 채팅 성능 검증용 테스트 데이터 정리 스크립트
 *
 * setup-test-accounts.mjs가 만든 자원을 역순으로 제거하고, 잔존 0건을 검증한다.
 * auth.users DELETE 트리거(delete_user_from_public)가 public.user 행을 지운다.
 *
 * 실행: node scripts/perf/cleanup-test-accounts.mjs <setup-result.json>
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const EXPECTED_PROJECT_REF = 'yyisakaqnaoomehqlyjz'
const ENV_FILE = '.env'

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

const resultPath = process.argv[2]
if (!resultPath) {
  throw new Error('사용법: node scripts/perf/cleanup-test-accounts.mjs <setup-result.json>')
}

const setup = JSON.parse(readFileSync(resultPath, 'utf8'))
const env = parseEnv(ENV_FILE)
const url = env.NEXT_PUBLIC_SUPABASE_URL

if (!url.includes(EXPECTED_PROJECT_REF)) {
  throw new Error(`운영 프로젝트가 아닙니다. 실제: ${url}`)
}

const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const userIds = setup.accounts.map((account) => account.userId)
const { nbreadId } = setup

const main = async () => {
  // 1. 채팅 메시지
  await admin.from('chat_messages').delete().eq('nbread_id', nbreadId)

  // 2. 알림 (채팅 웹훅이 생성했을 수 있음)
  await admin.from('notification').delete().in('user_id', userIds)

  // 3. 참여자, 엔빵
  await admin.from('participant').delete().eq('nbread_id', nbreadId)
  await admin.from('nbread').delete().eq('id', nbreadId)

  // 4. 알림 설정, fcm_token
  await admin.from('user_notification_settings').delete().in('user_id', userIds)
  await admin.from('fcm_token').delete().in('user_id', userIds)

  // 5. auth 계정 (트리거가 public.user 행을 함께 제거)
  for (const userId of userIds) {
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) {
      console.error(`auth 계정 삭제 실패 (${userId}): ${error.message}`)
    }
  }

  // 검증: 전부 0건이어야 한다
  const checks = {
    chat_messages: await admin
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('nbread_id', nbreadId),
    notification: await admin
      .from('notification')
      .select('id', { count: 'exact', head: true })
      .in('user_id', userIds),
    participant: await admin
      .from('participant')
      .select('id', { count: 'exact', head: true })
      .eq('nbread_id', nbreadId),
    nbread: await admin
      .from('nbread')
      .select('id', { count: 'exact', head: true })
      .eq('id', nbreadId),
    user: await admin
      .from('user')
      .select('id', { count: 'exact', head: true })
      .in('id', userIds),
    fcm_token: await admin
      .from('fcm_token')
      .select('user_id', { count: 'exact', head: true })
      .in('user_id', userIds),
  }

  const report = Object.fromEntries(
    Object.entries(checks).map(([table, response]) => [table, response.count]),
  )

  console.log(JSON.stringify({ verifiedAt: new Date().toISOString(), remaining: report }, null, 2))

  const leftover = Object.entries(report).filter(([, count]) => count !== 0)
  if (leftover.length > 0) {
    console.error('잔존 데이터 있음:', leftover)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
