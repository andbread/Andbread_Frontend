import { apiRequest } from '@/lib/apiClient'
import { captureAppError } from '@/lib/sentry/sentry'

export const deleteParticipants = async (userId: string, nbreadId: string) => {
  try {
    await apiRequest(`/api/nbreads/${nbreadId}/participants`, {
      method: 'DELETE',
      query: { userId },
    })

    return null
  } catch (error) {
    console.error('error deleting participants', error)
    captureAppError(error, {
      action: 'participant.delete',
      tags: { userId, nbreadId },
    })
    throw error
  }
}
