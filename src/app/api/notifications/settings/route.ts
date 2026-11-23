import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, ok } from '@/app/api/_lib/response'
import { getNotificationState } from '@/lib/server/notification/getNotificationState'
import {
  updateNotificationState,
  type NotificationSettingsUpdate,
} from '@/lib/server/notification/updateNotificationState'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BOOLEAN_FIELDS = [
  'allEnabled',
  'chatEnabled',
  'inviteEnabled',
  'friendEnabled',
  'paymentEnabled',
] as const

const parseSettings = (body: unknown): NotificationSettingsUpdate | null => {
  if (typeof body !== 'object' || body === null) return null

  const source = body as Record<string, unknown>
  const settings: NotificationSettingsUpdate = {}

  for (const field of BOOLEAN_FIELDS) {
    const value = source[field]
    if (value === undefined) continue
    if (typeof value !== 'boolean') return null
    settings[field] = value
  }

  return settings
}

export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  try {
    const settings = await getNotificationState(auth.client, auth.user.id)
    return ok(settings)
  } catch (error) {
    captureAppError(error, {
      action: 'notification.get_settings',
      tags: { userId: auth.user.id },
    })
    return fail(500, '알림 설정을 불러오지 못했습니다.')
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  const settings = parseSettings(body)

  if (!settings) {
    return fail(400, '알림 설정 값이 올바르지 않습니다.')
  }

  try {
    const updated = await updateNotificationState(
      auth.client,
      auth.user.id,
      settings,
    )
    return ok(updated)
  } catch (error) {
    captureAppError(error, {
      action: 'notification.update_settings',
      tags: { userId: auth.user.id },
    })
    return fail(500, '알림 설정을 변경하지 못했습니다.')
  }
}
