import { apiRequest } from '@/lib/apiClient'
import type { NotificationSettings } from '@/lib/server/notification/getNotificationState'

export type { NotificationSettings }

export const getNotificationState = async (userId: string) => {
  try {
    return await apiRequest<NotificationSettings>('/api/notifications/settings')
  } catch (error) {
    console.error('Error fetching notification state:', error)
    throw error
  }
}
