import { apiRequest } from '@/lib/apiClient'
import type { NotificationSettings } from '@/lib/server/notification/getNotificationState'
import type { NotificationSettingsUpdate } from '@/lib/server/notification/updateNotificationState'

export type { NotificationSettingsUpdate }

export async function updateNotificationState(
  userId: string,
  settings: NotificationSettingsUpdate,
) {
  try {
    return await apiRequest<NotificationSettings>(
      '/api/notifications/settings',
      {
        method: 'PATCH',
        body: settings,
      },
    )
  } catch (error) {
    console.error('Error updating notification state:', error)
    throw error
  }
}
