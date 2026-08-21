import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, ok } from '@/app/api/_lib/response'
import { sendInviteRequest } from '@/lib/server/invite/sendInviteRequest'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ nbreadId: string }> }

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { nbreadId } = await context.params
  const body = (await request.json().catch(() => null)) as {
    targetUserId?: unknown
  } | null

  if (!body || typeof body.targetUserId !== 'string' || !body.targetUserId) {
    return fail(400, '초대할 사용자가 올바르지 않습니다.')
  }

  try {
    const invites = await sendInviteRequest(
      auth.client,
      nbreadId,
      body.targetUserId,
    )
    return ok(invites)
  } catch (error) {
    captureAppError(error, {
      action: 'invite.send_request',
      tags: { nbreadId, targetUserId: body.targetUserId },
    })
    return fail(500, '초대를 보내지 못했습니다.')
  }
}
