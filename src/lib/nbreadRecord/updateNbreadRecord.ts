import { apiRequest } from '@/lib/apiClient'
import { captureAppError } from '@/lib/sentry/sentry'

export const updateNbreadRecord = async (
  nbreadId: string,
  userId: string,
  isPaid: boolean,
  startDate: string,
) => {
  try {
    await apiRequest(`/api/nbreads/${nbreadId}/records`, {
      method: 'PATCH',
      body: { userId, isPaid, startDate },
    })

    return null
  } catch (error) {
    console.error('Error updating nbread record:', error)
    captureAppError(error, {
      action: 'nbread_record.update',
      tags: {
        nbreadId,
        userId,
        isPaid,
      },
      extra: {
        startDate,
      },
    })
    throw error
  }
}
