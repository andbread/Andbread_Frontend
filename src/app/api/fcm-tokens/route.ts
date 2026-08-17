import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, noContent } from '@/app/api/_lib/response'
import { upsertFcmToken } from '@/lib/server/fcmToken/upsertFcmToken'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = (await request.json().catch(() => null)) as {
    fcmToken?: unknown
  } | null

  if (!body || typeof body.fcmToken !== 'string' || !body.fcmToken) {
    return fail(400, 'FCM 토큰이 올바르지 않습니다.')
  }

  try {
    await upsertFcmToken(auth.client, auth.user.id, body.fcmToken)
    return noContent()
  } catch (error) {
    captureAppError(error, {
      action: 'fcm_token.upsert',
      tags: { userId: auth.user.id },
    })
    return fail(500, 'FCM 토큰 저장에 실패했습니다.')
  }
}
