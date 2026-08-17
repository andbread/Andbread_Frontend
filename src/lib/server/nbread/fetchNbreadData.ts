import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * payment_date는 원시 문자열 그대로 내려보낸다.
 * Date 변환은 JSON으로 직렬화할 수 없으므로 클라이언트 lib이 담당한다.
 */
export const fetchNbreadData = async (
  client: SupabaseClient,
  userId: string,
): Promise<{ nbreadId: string; paymentDate: string | null }[] | null> => {
  if (!userId) {
    console.error('userId가 유효하지 않습니다.')
    return null
  }

  const { data, error } = await client
    .from('nbread_records')
    .select('nbread_id, payment_date')
    .eq('user_id', userId)

  if (error) {
    console.error('데이터 가져오기 실패:', error)
    return null
  }

  return (
    data?.map((item) => ({
      nbreadId: item.nbread_id,
      paymentDate: item.payment_date,
    })) ?? []
  )
}
