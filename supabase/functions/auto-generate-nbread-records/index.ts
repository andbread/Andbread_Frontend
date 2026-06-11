import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { supabaseClient } from '../_shared/createClient.ts'
import { corsHeaders } from '../_shared/cors.ts'

type RpcResult = {
  status?: 'success' | 'skipped' | 'error'
  reason?: string
  nbread_id?: string
  start_date?: string
  end_date?: string
  payment_date?: string
  participant_count?: number
  inserted_count?: number
  existing_count?: number
  final_record_count?: number
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })

const getDateInTimeZone = (timeZone: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

// DB RPC의 처리 결과를 운영 로그 테이블에 저장한다.
// 실제 회차 이동과 납부 레코드 생성은 Edge Function이 아니라
// generate_nbread_records_for_due_group DB 함수가 트랜잭션으로 처리한다.
const insertLog = async ({
  nbreadId,
  result,
  errorMessage,
}: {
  nbreadId: string | null
  result: RpcResult
  errorMessage?: string
}) => {
  const { error } = await supabaseClient
    .from('nbread_auto_generation_logs')
    .insert({
      nbread_id: nbreadId,
      status: result.status ?? (errorMessage ? 'error' : 'skipped'),
      reason: result.reason ?? null,
      payment_date: result.payment_date ?? result.start_date ?? null,
      start_date: result.start_date ?? null,
      end_date: result.end_date ?? null,
      inserted_count: result.inserted_count ?? 0,
      error_message: errorMessage ?? null,
      metadata: result,
    })

  if (error) {
    console.error('Failed to insert auto generation log:', error)
  }
}

Deno.serve(async (req) => {
  // 브라우저나 관리 도구에서 호출할 때 필요한 CORS 사전 요청을 처리한다.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // pg_cron은 GET 또는 POST로 이 Edge Function을 호출한다.
  if (req.method !== 'POST' && req.method !== 'GET') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405)
  }

  // 외부에서 Cron 작업을 임의로 실행하지 못하도록 공유 비밀값을 검증한다.
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  // 서버의 UTC 날짜가 아니라 납부 기준 시간대의 오늘 날짜를 사용한다.
  const paymentTimeZone = Deno.env.get('PAYMENT_TIME_ZONE') ?? 'Asia/Seoul'
  const today = getDateInTimeZone(paymentTimeZone)

  // 현재 회차가 종료된 엔빵만 조회한다.
  // 이 조회는 처리 대상을 고를 뿐이며, 실제 날짜 재검증과 행 잠금은 RPC에서 수행한다.
  const { data: dueNbreads, error: dueNbreadsError } = await supabaseClient
    .from('nbread')
    .select('id, start_date, end_date')
    .not('start_date', 'is', null)
    .not('end_date', 'is', null)
    .lt('end_date', today)

  if (dueNbreadsError) {
    console.error('Failed to fetch due nbreads:', dueNbreadsError)
    return jsonResponse({ error: 'Failed to fetch due nbreads' }, 500)
  }

  const results = []

  // 엔빵별로 DB RPC를 호출한다. RPC는 다음 회차 날짜 계산, 참여자별 납부
  // 레코드 보충, nbread.start_date/end_date 갱신을 하나의 트랜잭션으로 처리한다.
  for (const nbread of dueNbreads ?? []) {
    const { data, error } = await supabaseClient.rpc(
      'generate_nbread_records_for_due_group',
      {
        p_nbread_id: nbread.id,
        p_today: today,
      },
    )

    if (error) {
      console.error(
        `Failed to generate records for nbread ${nbread.id}:`,
        error,
      )
      const result: RpcResult = {
        status: 'error',
        reason: 'rpc_failed',
        nbread_id: nbread.id,
      }

      await insertLog({
        nbreadId: nbread.id,
        result,
        errorMessage: error.message,
      })

      results.push({ ...result, error: error.message })
      continue
    }

    // 성공 또는 스킵 결과도 기록해 Cron이 어떤 엔빵을 어떻게 처리했는지 추적한다.
    const result = data as RpcResult
    await insertLog({
      nbreadId: result.nbread_id ?? nbread.id,
      result,
    })
    results.push(result)
  }

  // pg_cron 호출 자체는 한 번이지만 응답에는 엔빵별 처리 결과 집계를 반환한다.
  return jsonResponse({
    processedCount: results.length,
    successCount: results.filter((result) => result.status === 'success')
      .length,
    skippedCount: results.filter((result) => result.status === 'skipped')
      .length,
    errorCount: results.filter((result) => result.status === 'error').length,
    results,
  })
})
