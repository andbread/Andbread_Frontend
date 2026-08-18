import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, ok } from '@/app/api/_lib/response'
import { getInviteUser } from '@/lib/server/invite/getInviteUser'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ nbreadId: string }> }

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { nbreadId } = await context.params
  const tag = new URL(request.url).searchParams.get('tag')

  if (!tag) {
    return fail(400, '검색할 태그가 없습니다.')
  }

  try {
    const candidates = await getInviteUser(
      auth.client,
      tag,
      nbreadId,
      auth.user.id,
    )
    return ok(candidates)
  } catch (error) {
    captureAppError(error, {
      action: 'invite.get_candidates',
      tags: { nbreadId, userId: auth.user.id },
    })
    return fail(500, '초대할 사용자를 불러오지 못했습니다.')
  }
}
