import { optionalAuth } from '@/app/api/_lib/requireAuth'
import { fail, ok } from '@/app/api/_lib/response'
import { getInviteByToken } from '@/lib/server/invite/getInviteByToken'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ token: string }> }

/**
 * 초대 링크는 로그인 전에도 열리므로 이 엔드포인트만 인증이 선택이다.
 */
export async function GET(request: Request, context: RouteContext) {
  const { token } = await context.params

  try {
    const invite = await getInviteByToken(optionalAuth(request), token)
    return ok(invite)
  } catch (error) {
    captureAppError(error, {
      action: 'invite.get_by_token',
    })
    return fail(500, '초대 정보를 불러오지 못했습니다.')
  }
}
