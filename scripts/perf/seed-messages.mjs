/**
 * 테스트 엔빵의 채팅 메시지를 정확히 N건으로 맞춘다.
 *
 * 기존 메시지를 전부 지우고 N건을 새로 넣는다. 두 테스트 계정이 번갈아
 * 발신하고 created_at을 1분 간격으로 흩어, 시간 그룹핑(showSender/showTime)
 * 분기가 실제 채팅과 비슷하게 걸리도록 한다.
 *
 * 실행: node scripts/perf/seed-messages.mjs <setup.json> --count 100
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const EXPECTED_PROJECT_REF = 'yyisakaqnaoomehqlyjz'

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

const setupPath = process.argv[2]
const countIndex = process.argv.indexOf('--count')
const count = countIndex === -1 ? 100 : Number(process.argv[countIndex + 1])

if (!setupPath || !Number.isFinite(count)) {
  throw new Error('사용법: node scripts/perf/seed-messages.mjs <setup.json> --count 100')
}

const setup = JSON.parse(readFileSync(setupPath, 'utf8'))
const env = parseEnv('.env')

if (!env.NEXT_PUBLIC_SUPABASE_URL.includes(EXPECTED_PROJECT_REF)) {
  throw new Error(`운영 프로젝트가 아닙니다: ${env.NEXT_PUBLIC_SUPABASE_URL}`)
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const main = async () => {
  const { nbreadId, accounts } = setup

  const { error: deleteError } = await admin
    .from('chat_messages')
    .delete()
    .eq('nbread_id', nbreadId)

  if (deleteError) {
    throw new Error(`기존 메시지 삭제 실패: ${deleteError.message}`)
  }

  // 가장 최근 메시지가 현재 시각 근처가 되도록 과거로 거슬러 배치
  const baseTime = Date.now() - count * 60_000

  const rows = Array.from({ length: count }, (_, index) => {
    const author = accounts[index % 2 === 0 ? 0 : 1]
    return {
      nbread_id: nbreadId,
      user_id: author.userId,
      user_name: author.name,
      user_profile_image: null,
      content: `seed-${String(index + 1).padStart(4, '0')} 성능 측정용 더미 메시지`,
      created_at: new Date(baseTime + index * 60_000).toISOString(),
    }
  })

  const CHUNK = 100
  for (let offset = 0; offset < rows.length; offset += CHUNK) {
    const { error } = await admin
      .from('chat_messages')
      .insert(rows.slice(offset, offset + CHUNK))

    if (error) {
      throw new Error(`시딩 실패(offset ${offset}): ${error.message}`)
    }
  }

  const { count: finalCount, error: countError } = await admin
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('nbread_id', nbreadId)

  if (countError) {
    throw new Error(`검증 실패: ${countError.message}`)
  }

  if (finalCount !== count) {
    throw new Error(`기대 ${count}건, 실제 ${finalCount}건`)
  }

  console.log(JSON.stringify({ nbreadId, seeded: finalCount }))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
