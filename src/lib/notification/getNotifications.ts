import { apiRequest } from '@/lib/apiClient'
import { Notification } from '@/types/notification'
import { sortNotifications } from './sortNotifications'

export const getNotification = async (userId: string) => {
  try {
    const notifications = await apiRequest<Notification[]>('/api/notifications')

    return sortNotifications(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    throw error
  }
}
