import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, ok } from '@/app/api/_lib/response'
import { respondToInvite } from '@/lib/server/invite/respondToInvite'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ token: string }> }

/**
 * respond_to_nbread_invite가 raise하는 업무 오류다.
 * 화면은 오류 메시지에 이 코드가 들어 있는지로 안내를 고르므로 message와 code에 코드를 그대로 싣는다.
 * LOGIN_REQUIRED는 requireAuth를 통과한 뒤라 사실상 나오지 않고,
 * 401로 돌려주면 apiClient가 세션을 지우므로 403으로 둔다.
 */
const INVITE_ERROR_STATUS: Record<string, number> = {
  INVALID_INVITE_RESPONSE: 400,
  LOGIN_REQUIRED: 403,
  INVITE_TARGET_MISMATCH: 403,
  INVITE_NOT_FOUND: 404,
  NBREAD_NOT_FOUND: 404,
  INVITE_ALREADY_ACCEPTED: 409,
  INVITE_ALREADY_REJECTED: 409,
  INVITE_EXPIRED: 409,
  INVALID_INVITE_STATUS_TRANSITION: 409,
}

const toInviteErrorCode = (error: unknown) => {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : ''

  return message in INVITE_ERROR_STATUS ? message : null
}

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
    const code = toInviteErrorCode(error)

    if (code) {
      return fail(INVITE_ERROR_STATUS[code], code, code)
    }

    captureAppError(error, {
      action: `invite.${body.response}`,
    })
    return fail(500, '초대에 응답하지 못했습니다.')
  }
}
