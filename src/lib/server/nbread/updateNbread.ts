import type { SupabaseClient } from '@supabase/supabase-js'
import { Nbread } from '@/types/nbread'

export const updateNbread = async (
  client: SupabaseClient,
  nbreadId: string,
  nbread: Nbread,
) => {
  const { error } = await client
    .from('nbread')
    .update({
      title: nbread.title,
      participant_count: nbread.participantCount,
      amount: nbread.amount,
      payment_period: nbread.paymentPeriod,
      payment_date: nbread.paymentDate,
      payment_month: nbread.paymentMonth,
      leader_id: nbread.leaderId,
    })
    .eq('id', nbreadId)

  if (error) {
    console.error('Error updating nbread:', error)
    throw error
  }
}
