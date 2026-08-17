import { apiRequest } from '@/lib/apiClient'
import { Nbread } from '@/types/nbread'

export const getUserNbreads = async (
  userId: string,
): Promise<{ monthlyNbreads: Nbread[]; myNbreads: Nbread[] }> => {
  if (!userId) return { monthlyNbreads: [], myNbreads: [] }

  // 이번 달 판정은 사용자의 현지 시간대를 기준으로 해야 하므로 여기서 계산해 넘긴다.
  const currentMonth = new Date().getMonth() + 1

  try {
    return await apiRequest<{ monthlyNbreads: Nbread[]; myNbreads: Nbread[] }>(
      '/api/nbreads',
      { query: { currentMonth } },
    )
  } catch (error) {
    // 실패 시 빈 목록을 돌려주던 기존 동작을 유지한다.
    console.error('❌ Failed to fetch nbreads:', error)
    return { monthlyNbreads: [], myNbreads: [] }
  }
}
