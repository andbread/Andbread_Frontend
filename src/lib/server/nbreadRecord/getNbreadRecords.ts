import type { SupabaseClient } from '@supabase/supabase-js'
import { NbreadRecord } from '@/types/nbread'

/**
 * startDate는 'YYYY-MM-DD'로 정규화해서 넘긴다.
 * toISOString은 항상 UTC 기준이라 브라우저에서 하던 변환과 결과가 같다.
 */
export const getNbreadRecords = async (
  client: SupabaseClient,
  nbreadId: string,
  startDate: string,
): Promise<NbreadRecord[]> => {
  const { data, error } = await client
    .from('nbread_records')
    .select('*')
    .eq('nbread_id', nbreadId)
    .eq('payment_date', startDate)

  if (error) {
    console.error('Error fetching nbread record:', error)
    throw error
  }

  return data.map((item) => ({
    userId: item.user_id,
    nbreadId: item.nbread_id,
    paymentDate: item.payment_date,
    isPaid: item.is_paid,
  }))
}
