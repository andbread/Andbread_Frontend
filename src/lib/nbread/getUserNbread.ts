import { supabase } from '@/lib/supabaseClient'
import { Nbread } from '@/types/nbread'
import { NbreadRow } from '@/types/supabase'

export const getUserNbreads = async (userId: string): Promise<Nbread[]> => {
  if (!userId) return []

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

  console.log(`✅ Retrieved participant entries:`, participantEntries)

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

  // Supabase에서 가져온 데이터를 type에 맞게 변환
  const renamedNbreadsData: Nbread[] = (nbreads as NbreadRow[])?.map(
    (nbread) => ({
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

  return renamedNbreadsData
}
