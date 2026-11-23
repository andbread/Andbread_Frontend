import { apiRequest } from '@/lib/apiClient'
import { captureAppError } from '@/lib/sentry/sentry'
import type {
  InviteResponse,
  InviteResponseResult,
} from '@/lib/server/invite/respondToInvite'

export type { InviteResponse }

export const respondToInvite = async (
  inviteToken: string,
  response: InviteResponse,
) => {
  try {
    return await apiRequest<InviteResponseResult>(
      `/api/invites/${inviteToken}/response`,
      {
        method: 'POST',
        body: { response },
      },
    )
  } catch (error) {
    captureAppError(error, {
      action: `invite.${response}`,
    })
    throw error
  }
}
