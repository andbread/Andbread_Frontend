import { apiRequest } from '@/lib/apiClient'
import { captureAppError } from '@/lib/sentry/sentry'

export const upsertFcmToken = async (userId: string, fcmToken: string) => {
  try {
    await apiRequest('/api/fcm-tokens', {
      method: 'PUT',
      body: { fcmToken },
    })

    return null
  } catch (error) {
    captureAppError(error, {
      action: 'fcm_token.upsert',
      tags: { userId },
    })
    throw error
  }
}
