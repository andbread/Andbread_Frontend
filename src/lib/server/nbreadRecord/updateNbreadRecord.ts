import type { SupabaseClient } from '@supabase/supabase-js'

export const updateNbreadRecord = async (
  client: SupabaseClient,
  nbreadId: string,
  userId: string,
  isPaid: boolean,
  paymentDate: string,
) => {
  const { error } = await client
    .from('nbread_records')
    .update({
      is_paid: isPaid,
    })
    .eq('nbread_id', nbreadId)
    .eq('user_id', userId)
    .eq('payment_date', paymentDate)

  if (error) {
    console.error('Error updating nbread record:', error)
    throw error
  }
}
