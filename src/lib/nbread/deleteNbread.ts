import { apiRequest } from '@/lib/apiClient'
import { captureAppError } from '@/lib/sentry/sentry'

export const deleteNbread = async (nbreadId: string) => {
  try {
    await apiRequest(`/api/nbreads/${nbreadId}`, { method: 'DELETE' })

    return null
  } catch (error) {
    captureAppError(error, {
      action: 'nbread.delete',
      tags: { nbreadId },
    })
    throw error
  }
}
