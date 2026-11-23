import { apiRequest } from '@/lib/apiClient'

export const fetchNbreadData = async (
  userId: string,
): Promise<{ nbread_id: string; payment_date: string | Date | null }[] | null> => {
  if (!userId) {
    console.error('userId가 유효하지 않습니다.')
    return null
  }

  try {
    const records = await apiRequest<
      { nbreadId: string; paymentDate: string | null }[] | null
    >('/api/nbreads/records')

    if (!records) return null

    // Date 변환은 JSON으로 실어 나를 수 없어 여기서 수행한다.
    return records.map((record) => ({
      nbread_id: record.nbreadId,
      payment_date: record.paymentDate ? new Date(record.paymentDate) : null,
    }))
  } catch (error) {
    // 실패 시 null을 돌려주던 기존 동작을 유지한다.
    console.error('데이터 가져오기 실패:', error)
    return null
  }
}
