import { apiRequest } from '@/lib/apiClient'
import { Nbread } from '@/types/nbread'
import { captureAppError } from '@/lib/sentry/sentry'

export const insertNbread = async (nbread: Nbread) => {
  try {
    const { id } = await apiRequest<{ id: string }>('/api/nbreads', {
      method: 'POST',
      body: nbread,
    })

    return id
  } catch (error) {
    captureAppError(error, {
      action: 'nbread.insert',
      tags: { leaderId: nbread.leaderId ?? undefined },
      extra: {
        paymentPeriod: nbread.paymentPeriod,
        participantCount: nbread.participantCount,
      },
    })
    throw error
  }
}
