import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, noContent, ok } from '@/app/api/_lib/response'
import { getNbreadRecords } from '@/lib/server/nbreadRecord/getNbreadRecords'
import { updateNbreadRecord } from '@/lib/server/nbreadRecord/updateNbreadRecord'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ nbreadId: string }> }

/** 기존 lib이 하던 new Date(startDate).toISOString().split('T')[0] 변환을 그대로 옮긴다. */
const toPaymentDate = (value: string | null) => {
  if (!value) return null

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toISOString().split('T')[0]
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { nbreadId } = await context.params
  const paymentDate = toPaymentDate(
    new URL(request.url).searchParams.get('startDate'),
  )

  if (!paymentDate) {
    return fail(400, '조회 기준일이 올바르지 않습니다.')
  }

  try {
    const records = await getNbreadRecords(auth.client, nbreadId, paymentDate)
    return ok(records)
  } catch (error) {
    captureAppError(error, {
      action: 'nbread_record.list',
      tags: { nbreadId, userId: auth.user.id },
    })
    return fail(500, '납부 현황을 불러오지 못했습니다.')
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { nbreadId } = await context.params
  const body = (await request.json().catch(() => null)) as {
    userId?: unknown
    isPaid?: unknown
    startDate?: unknown
  } | null

  // 다른 참여자의 납부 상태를 바꾸는 기능이라 userId를 본문으로 받는다.
  if (
    !body ||
    typeof body.userId !== 'string' ||
    typeof body.isPaid !== 'boolean' ||
    typeof body.startDate !== 'string'
  ) {
    return fail(400, '납부 상태 값이 올바르지 않습니다.')
  }

  const paymentDate = toPaymentDate(body.startDate)
  if (!paymentDate) {
    return fail(400, '기준일이 올바르지 않습니다.')
  }

  try {
    await updateNbreadRecord(
      auth.client,
      nbreadId,
      body.userId,
      body.isPaid,
      paymentDate,
    )
    return noContent()
  } catch (error) {
    captureAppError(error, {
      action: 'nbread_record.update',
      tags: { nbreadId, userId: body.userId, isPaid: body.isPaid },
      extra: { paymentDate },
    })
    return fail(500, '납부 상태를 변경하지 못했습니다.')
  }
}
