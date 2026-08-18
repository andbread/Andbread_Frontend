import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, ok } from '@/app/api/_lib/response'
import { respondToInvite } from '@/lib/server/invite/respondToInvite'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ token: string }> }

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { token } = await context.params
  const body = (await request.json().catch(() => null)) as {
    response?: unknown
  } | null

  if (
    !body ||
    (body.response !== 'accepted' && body.response !== 'rejected')
  ) {
    return fail(400, '초대 응답 값이 올바르지 않습니다.')
  }

  try {
    const result = await respondToInvite(auth.client, token, body.response)
    return ok(result)
  } catch (error) {
    captureAppError(error, {
      action: `invite.${body.response}`,
    })
    return fail(500, '초대에 응답하지 못했습니다.')
  }
}
