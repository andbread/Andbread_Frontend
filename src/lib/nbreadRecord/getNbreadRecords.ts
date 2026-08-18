import { apiRequest } from '@/lib/apiClient'
import { NbreadRecord } from '@/types/nbread'

export const getNbreadRecords = async (nbreadId: string, startDate: string) => {
  // startDate는 타입상 string이지만 Nbread.startDate가 null일 수 있어 호출부가 !로 넘긴다.
  // 이관 전에는 이 경우 1970-01-01로 조회되어 결과가 항상 비어 있었다.
  // 요청을 보내지 않고 같은 값을 돌려주어 기존 동작을 유지한다.
  if (!startDate) return []

  try {
    return await apiRequest<NbreadRecord[]>(
      `/api/nbreads/${nbreadId}/records`,
      { query: { startDate } },
    )
  } catch (error) {
    console.error('Error fetching nbread record:', error)
    throw error
  }
}
