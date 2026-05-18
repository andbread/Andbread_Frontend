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
  inserted_count?: number
  existing_count?: number
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405)
  }

  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const paymentTimeZone = Deno.env.get('PAYMENT_TIME_ZONE') ?? 'Asia/Seoul'
  const today = getDateInTimeZone(paymentTimeZone)

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

    const result = data as RpcResult
    await insertLog({
      nbreadId: result.nbread_id ?? nbread.id,
      result,
    })
    results.push(result)
  }

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
