import { ApiError, apiRequest } from '@/lib/apiClient'

export const markNotificationAsRead = async (
  notificationId: number,
  userId: string,
) => {
  try {
    await apiRequest(`/api/notifications/${notificationId}`, {
      method: 'PATCH',
      body: { isRead: true },
    })
  } catch (error) {
    // 대상이 없거나 소유자가 아닌 경우의 기존 오류를 그대로 유지한다.
    if (error instanceof ApiError && error.status === 404) {
      throw new Error('Notification not found or not owned by the current user')
    }

    throw error
  }
}
