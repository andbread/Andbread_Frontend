import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, ok } from '@/app/api/_lib/response'
import { getUserNbreads } from '@/lib/server/nbread/getUserNbreads'
import { insertNbread } from '@/lib/server/nbread/insertNbread'
import { captureAppError } from '@/lib/sentry/sentry'
import { Nbread } from '@/types/nbread'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  // 월 판정은 사용자의 현지 시간대를 따라야 하므로 클라이언트가 넘긴 값을 쓴다.
  const currentMonth = Number(
    new URL(request.url).searchParams.get('currentMonth'),
  )

  if (!Number.isInteger(currentMonth) || currentMonth < 1 || currentMonth > 12) {
    return fail(400, '조회할 월이 올바르지 않습니다.')
  }

  try {
    const nbreads = await getUserNbreads(auth.client, auth.user.id, currentMonth)
    return ok(nbreads)
  } catch (error) {
    captureAppError(error, {
      action: 'nbread.list',
      tags: { userId: auth.user.id },
    })
    return fail(500, '엔빵 목록을 불러오지 못했습니다.')
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = (await request.json().catch(() => null)) as Nbread | null

  if (!body || typeof body.title !== 'string') {
    return fail(400, '엔빵 정보가 올바르지 않습니다.')
  }

  try {
    const id = await insertNbread(auth.client, body)
    return ok({ id }, 201)
  } catch (error) {
    captureAppError(error, {
      action: 'nbread.insert',
      tags: { leaderId: body.leaderId ?? undefined },
      extra: {
        paymentPeriod: body.paymentPeriod,
        participantCount: body.participantCount,
      },
    })
    return fail(500, '엔빵을 만들지 못했습니다.')
  }
}
