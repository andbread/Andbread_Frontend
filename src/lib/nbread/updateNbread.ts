import { apiRequest } from '@/lib/apiClient'
import { Nbread } from '@/types/nbread'
import { captureAppError } from '@/lib/sentry/sentry'

export const updateNbread = async (nbread: Nbread) => {
  try {
    await apiRequest(`/api/nbreads/${nbread.id}`, {
      method: 'PATCH',
      body: nbread,
    })

    return null
  } catch (error) {
    console.error('Error updating nbread:', error)
    captureAppError(error, {
      action: 'nbread.update',
      tags: {
        nbreadId: nbread.id,
        leaderId: nbread.leaderId ?? undefined,
      },
    })
    throw error
  }
}
