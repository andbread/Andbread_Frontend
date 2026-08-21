import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, ok } from '@/app/api/_lib/response'
import { createLinkInvite } from '@/lib/server/nbread/createLinkInvite'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ nbreadId: string }> }

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { nbreadId } = await context.params

  try {
    const inviteToken = await createLinkInvite(auth.client, nbreadId)
    return ok({ inviteToken }, 201)
  } catch (error) {
    captureAppError(error, {
      action: 'invite.create_link',
      tags: { nbreadId },
    })
    return fail(500, '초대 링크를 만들지 못했습니다.')
  }
}
