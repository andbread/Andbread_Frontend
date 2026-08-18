import { apiRequest } from '@/lib/apiClient'
import { captureAppError } from '@/lib/sentry/sentry'
import type { PendingInvite } from '@/lib/server/invite/getPendingInvites'

export type { PendingInvite }

export const getPendingInvites = async (
  userId: string,
): Promise<PendingInvite[]> => {
  try {
    return await apiRequest<PendingInvite[]>('/api/invites/pending')
  } catch (error) {
    captureAppError(error, {
      action: 'invite.get_pending',
      tags: { userId },
    })
    throw error
  }
}
