import { apiRequest } from '@/lib/apiClient'
import { Participant } from '@/types/nbread'
import { captureAppError } from '@/lib/sentry/sentry'

interface InsertParticipantResult {
  isInsert: string
  title: string
  subTitle: string
  buttonTitle: string
}

export const insertParticipant = async (
  participant: Participant,
  nbreadId: string,
) => {
  try {
    const result = await apiRequest<InsertParticipantResult | null>(
      `/api/nbreads/${nbreadId}/participants`,
      {
        method: 'POST',
        body: { isLeader: participant.isLeader },
      },
    )

    // 참여자 조회가 실패하면 아무 값도 돌려주지 않던 기존 동작을 유지한다.
    return result ?? undefined
  } catch (error) {
    captureAppError(error, {
      action: 'participant.insert',
      tags: {
        nbreadId,
        userId: participant.user.id,
      },
      extra: {
        isLeader: participant.isLeader,
      },
    })
    throw error
  }
}
