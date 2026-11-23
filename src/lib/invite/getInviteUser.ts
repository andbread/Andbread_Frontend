import { apiRequest } from '@/lib/apiClient'
import type { InviteCandidate } from '@/lib/server/invite/getInviteUser'

export const getInviteUser = async (tag: string, nbreadId: string) => {
  try {
    const candidates = await apiRequest<InviteCandidate[] | null>(
      `/api/nbreads/${nbreadId}/invites/candidates`,
      { query: { tag } },
    )

    return candidates ?? undefined
  } catch (error) {
    // 실패 시 아무 값도 돌려주지 않던 기존 동작을 유지한다.
    console.error('유저 데이터 요청 실패', error)
  }
}
