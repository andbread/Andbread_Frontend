import { apiRequest } from '@/lib/apiClient'
import { captureAppError } from '@/lib/sentry/sentry'

export const createLinkInvite = async (nbreadId: string) => {
  let inviteToken: string

  try {
    const result = await apiRequest<{ inviteToken: string }>(
      `/api/nbreads/${nbreadId}/invites/link`,
      { method: 'POST' },
    )
    inviteToken = result.inviteToken
  } catch (error) {
    captureAppError(error, {
      action: 'invite.create_link',
      tags: { nbreadId },
    })
    throw error
  }

  // origin을 아는 쪽에서 URL을 조립한다.
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ??
    window.location.origin

  return `${baseUrl}/invite/${inviteToken}`
}
