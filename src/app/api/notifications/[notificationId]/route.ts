import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, noContent } from '@/app/api/_lib/response'
import { deleteNotification } from '@/lib/server/notification/deleteNotifications'
import { markNotificationAsRead } from '@/lib/server/notification/markNotificationAsRead'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ notificationId: string }> }

const NOT_FOUND_MESSAGE = '알림을 찾을 수 없거나 권한이 없습니다.'

const parseNotificationId = async (context: RouteContext) => {
  const { notificationId } = await context.params
  const parsed = Number(notificationId)

  return Number.isInteger(parsed) ? parsed : null
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const notificationId = await parseNotificationId(context)
  if (notificationId === null) {
    return fail(400, '알림 식별자가 올바르지 않습니다.')
  }

  try {
    const updatedCount = await markNotificationAsRead(
      auth.client,
      notificationId,
      auth.user.id,
    )

    if (updatedCount !== 1) {
      return fail(404, NOT_FOUND_MESSAGE)
    }

    return noContent()
  } catch (error) {
    captureAppError(error, {
      action: 'notification.mark_as_read',
      tags: { userId: auth.user.id },
    })
    return fail(500, '알림을 읽음 처리하지 못했습니다.')
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const notificationId = await parseNotificationId(context)
  if (notificationId === null) {
    return fail(400, '알림 식별자가 올바르지 않습니다.')
  }

  try {
    const deletedCount = await deleteNotification(
      auth.client,
      notificationId,
      auth.user.id,
    )

    if (deletedCount !== 1) {
      return fail(404, NOT_FOUND_MESSAGE)
    }

    return noContent()
  } catch (error) {
    captureAppError(error, {
      action: 'notification.delete',
      tags: { userId: auth.user.id },
    })
    return fail(500, '알림을 삭제하지 못했습니다.')
  }
}
