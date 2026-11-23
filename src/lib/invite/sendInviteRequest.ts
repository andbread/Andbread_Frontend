import { apiRequest } from '@/lib/apiClient'
import { captureAppError } from '@/lib/sentry/sentry'
import type { InviteRequestResult } from '@/lib/server/invite/sendInviteRequest'

export const sendInviteRequest = async (
  nbreadId: string,
  targetUserId: string,
) => {
  try {
    return await apiRequest<InviteRequestResult[]>(
      `/api/nbreads/${nbreadId}/invites`,
      {
        method: 'POST',
        body: { targetUserId },
      },
    )
  } catch (error) {
    // 실패 시 아무 값도 돌려주지 않던 기존 동작을 유지한다.
    console.error('초대 요청 중 오류 발생:', error)
    captureAppError(error, {
      action: 'invite.send_request',
      tags: { nbreadId, targetUserId },
    })
  }
}
