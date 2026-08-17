import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, ok } from '@/app/api/_lib/response'
import { fetchNbreadData } from '@/lib/server/nbread/fetchNbreadData'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  try {
    const records = await fetchNbreadData(auth.client, auth.user.id)
    return ok(records)
  } catch (error) {
    captureAppError(error, {
      action: 'nbread.records',
      tags: { userId: auth.user.id },
    })
    return fail(500, '납부 기록을 불러오지 못했습니다.')
  }
}
