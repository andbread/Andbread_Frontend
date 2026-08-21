import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, ok } from '@/app/api/_lib/response'
import { getUserTotalNbreadAmount } from '@/lib/server/nbread/getUserTotalNbreadAmount'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  try {
    const totalAmount = await getUserTotalNbreadAmount(
      auth.client,
      auth.user.id,
    )
    return ok({ totalAmount })
  } catch (error) {
    captureAppError(error, {
      action: 'nbread.summary',
      tags: { userId: auth.user.id },
    })
    return fail(500, '정산 합계를 불러오지 못했습니다.')
  }
}
