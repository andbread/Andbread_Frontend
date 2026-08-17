import type { SupabaseClient } from '@supabase/supabase-js'
import { Nbread } from '@/types/nbread'

export const insertNbread = async (
  client: SupabaseClient,
  nbread: Nbread,
): Promise<string> => {
  const { data, error } = await client
    .from('nbread')
    .insert({
      title: nbread.title,
      participant_count: nbread.participantCount,
      amount: nbread.amount,
      payment_period: nbread.paymentPeriod,
      payment_date: nbread.paymentDate,
      payment_month: nbread.paymentMonth,
      leader_id: nbread.leaderId,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error inserting nbread:', error)
    throw error
  }

  return data.id
}
