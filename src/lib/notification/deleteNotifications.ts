import { ApiError, apiRequest } from '@/lib/apiClient'

export const deleteNotification = async (
  notificationId: number,
  userId: string,
) => {
  try {
    await apiRequest(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    })
  } catch (error) {
    // 대상이 없거나 소유자가 아닌 경우의 기존 오류를 그대로 유지한다.
    if (error instanceof ApiError && error.status === 404) {
      throw new Error('Notification not found or not owned by the current user')
    }

    console.error('Error deleting notification:', error)
    throw error
  }
}

export const deleteAllNotifications = async (userId: string) => {
  try {
    await apiRequest('/api/notifications', { method: 'DELETE' })
  } catch (error) {
    console.error('Error deleting notifications:', error)
    throw error
  }
}
