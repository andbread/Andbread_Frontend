import { apiRequest } from '@/lib/apiClient'
import { captureAppError } from '@/lib/sentry/sentry'
import type {
  InviteDetails,
  InviteStatus,
} from '@/lib/server/invite/getInviteByToken'

export type { InviteDetails, InviteStatus }

export const getInviteByToken = async (
  inviteToken: string,
): Promise<InviteDetails | null> => {
  try {
    // 로그인 전에도 열리는 공개 링크라 서버는 토큰을 요구하지 않는다.
    // 다만 로그인 상태라면 토큰이 붙어야 RLS를 통과하므로 apiRequest 기본 동작을 쓴다.
    return await apiRequest<InviteDetails | null>(
      `/api/invites/${inviteToken}`,
    )
  } catch (error) {
    captureAppError(error, {
      action: 'invite.get_by_token',
    })
    throw error
  }
}
