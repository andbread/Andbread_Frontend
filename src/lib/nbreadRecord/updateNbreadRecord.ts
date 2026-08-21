import { apiRequest } from '@/lib/apiClient'
import { captureAppError } from '@/lib/sentry/sentry'

export const updateNbreadRecord = async (
  nbreadId: string,
  userId: string,
  isPaid: boolean,
  startDate: string,
) => {
  // startDate가 없으면 이관 전에도 1970-01-01로 조회되어 아무 행도 갱신하지 않았다.
  // 요청을 보내지 않고 같은 값을 돌려주어 기존 동작을 유지한다.
  if (!startDate) return null

  try {
    await apiRequest(`/api/nbreads/${nbreadId}/records`, {
      method: 'PATCH',
      body: { userId, isPaid, startDate },
    })

    return null
  } catch (error) {
    console.error('Error updating nbread record:', error)
    captureAppError(error, {
      action: 'nbread_record.update',
      tags: {
        nbreadId,
        userId,
        isPaid,
      },
      extra: {
        startDate,
      },
    })
    throw error
  }
}
