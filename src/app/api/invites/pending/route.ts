import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, ok } from '@/app/api/_lib/response'
import { getPendingInvites } from '@/lib/server/invite/getPendingInvites'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  try {
    const invites = await getPendingInvites(auth.client, auth.user.id)
    return ok(invites)
  } catch (error) {
    captureAppError(error, {
      action: 'invite.get_pending',
      tags: { userId: auth.user.id },
    })
    return fail(500, '받은 초대를 불러오지 못했습니다.')
  }
}
