import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, noContent, ok } from '@/app/api/_lib/response'
import { getNotification } from '@/lib/server/notification/getNotifications'
import { deleteAllNotifications } from '@/lib/server/notification/deleteNotifications'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  try {
    const notifications = await getNotification(auth.client, auth.user.id)
    return ok(notifications)
  } catch (error) {
    captureAppError(error, {
      action: 'notification.list',
      tags: { userId: auth.user.id },
    })
    return fail(500, '알림을 불러오지 못했습니다.')
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  try {
    await deleteAllNotifications(auth.client, auth.user.id)
    return noContent()
  } catch (error) {
    captureAppError(error, {
      action: 'notification.delete_all',
      tags: { userId: auth.user.id },
    })
    return fail(500, '알림을 삭제하지 못했습니다.')
  }
}
