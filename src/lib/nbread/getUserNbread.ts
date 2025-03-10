import { supabase } from '@/lib/supabaseClient'
import { Nbread } from '@/types/nbread'
import { NbreadRow } from '@/types/supabase'

export const getUserNbreads = async (userId: string): Promise<Nbread[]> => {
  if (!userId) return []

  // 1. 현재 로그인한 유저의 참여 정보를 가져옴
  const { data: participantEntries, error: participantError } = await supabase
    .from('participant')
    .select('nbread_id')
    .eq('user_id', userId)

  if (participantError) {
    console.error(
      '❌ Failed to fetch participant entries:',
      participantError.message,
    )
    return []
  }

  // 2. 현재 로그인한 유저가 참여 중인 엔빵 정보를 가져옴
  const nbreadIds = participantEntries.map((entry) => entry.nbread_id)
  if (nbreadIds.length === 0) {
    return []
  }
  const { data: nbreads, error } = await supabase
    .from('nbread')
    .select('*')
    .in('id', nbreadIds)

  if (error) {
    console.error('❌ Failed to fetch nbreads:', error.message)
    return []
  }

  // 3. Supabase에서 가져온 엔빵 정보를 type에 맞게 변환
  const renamedNbreadsData: Nbread[] = (nbreads as NbreadRow[])?.map(
    (nbread, index) => ({
      id: nbread.id,
      title: nbread.title,
      amount: nbread.amount,
      participantCount: nbread.participant_count,
      paymentDate: nbread.payment_date,
      paymentMonth: nbread.payment_month,
      paymentPeriod: nbread.payment_period as 'year' | 'month',
      leaderId: nbread.leader_id,
      participants: null,
      currentPaymentDate: nbread.current_payment_date,
    }),
  )

  // 4. 각 nbread 객체에 paidCount 값을 추가
  const nbreadWithPaidCounts = await Promise.all(
    renamedNbreadsData.map(async (nbread) => {
      const { count, error } = await supabase
        .from('nbread_records')
        .select('*', { count: 'exact' })
        .eq('nbread_id', nbread.id)
        .eq('payment_date', nbread.currentPaymentDate)
        .eq('is_paid', true)

      if (error) {
        console.error(
          `❌ Failed to fetch paid count for nbread_id: ${nbread.id}`,
          error.message,
        )
        return { ...nbread, paidCount: 0 }
      }

      return { ...nbread, paidCount: count || 0 }
    }),
  )

  return nbreadWithPaidCounts
}
