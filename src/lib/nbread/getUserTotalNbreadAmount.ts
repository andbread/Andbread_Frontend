import { apiRequest } from '@/lib/apiClient'

export const getUserTotalNbreadAmount = async (userId: string) => {
  if (!userId) return 0

  try {
    const { totalAmount } = await apiRequest<{ totalAmount: number }>(
      '/api/nbreads/summary',
    )

    return totalAmount
  } catch (error) {
    // 실패 시 0을 돌려주던 기존 동작을 유지한다.
    console.error('❌ Failed to fetch total nbread amount:', error)
    return 0
  }
}
